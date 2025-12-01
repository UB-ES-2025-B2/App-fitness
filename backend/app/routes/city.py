# app/routes/city.py
from flask import Blueprint, jsonify
from sqlalchemy import func

from app import db
from app.models import City, Activity, UserActivity, User
from app.utils.auth_utils import token_required

bp = Blueprint("city", __name__, url_prefix="/api/cities")


def calculate_user_city_progress(user_id: int, city_id: int) -> dict:
    """
    Calcula el progreso del usuario en una ciudad:
    - nº actividades definidas
    - nº actividades distintas completadas
    - nº total de completaciones
    - distancia total
    - duración total
    - lista de actividades con flag completed
    """
    city = City.query.get_or_404(city_id)

    # Actividades activas definidas en la ciudad
    activities = Activity.query.filter_by(city_id=city_id, is_active=True).all()
    total_defined = len(activities)

    # Si no hay actividades definidas -> todo a cero
    if total_defined == 0:
        return {
            "city": {
                "id": city.id,
                "name": city.name,
                "country": city.country,
                "slug": city.slug,
            },
            "stats": {
                "total_activities_defined": 0,
                "distinct_activities_completed": 0,
                "total_completions": 0,
                "total_distance_km": 0.0,
                "total_duration_sec": 0,
                "progress_percentage": 0,
            },
            "activities": [],
        }

    # Base: user_activity del usuario en esa ciudad
    ua_base = (
        db.session.query(UserActivity)
        .join(Activity, UserActivity.activity_id == Activity.id)
        .filter(
            UserActivity.user_id == user_id,
            Activity.city_id == city_id,
            Activity.is_active.is_(True),
        )
    )

    # nº total de completaciones (contando repeticiones)
    total_completions = ua_base.count()

    # actividades distintas completadas
    distinct_activity_ids = {
        row[0]
        for row in (
            db.session.query(UserActivity.activity_id)
            .join(Activity, UserActivity.activity_id == Activity.id)
            .filter(
                UserActivity.user_id == user_id,
                Activity.city_id == city_id,
                Activity.is_active.is_(True),
            )
            .distinct()
            .all()
        )
    }
    distinct_completed = len(distinct_activity_ids)

    # distancia total (suma de distance_km de las actividades completadas)
    total_distance_km = (
        db.session.query(func.coalesce(func.sum(Activity.distance_km), 0))
        .join(UserActivity, UserActivity.activity_id == Activity.id)
        .filter(
            UserActivity.user_id == user_id,
            Activity.city_id == city_id,
            Activity.is_active.is_(True),
        )
        .scalar()
    )
    total_distance_km = float(total_distance_km or 0.0)

    # duración total
    total_duration_sec = (
        db.session.query(func.coalesce(func.sum(UserActivity.duration_sec), 0))
        .join(Activity, UserActivity.activity_id == Activity.id)
        .filter(
            UserActivity.user_id == user_id,
            Activity.city_id == city_id,
            Activity.is_active.is_(True),
        )
        .scalar()
    ) or 0

    # % progreso
    progress_percentage = int(
        round((distinct_completed / total_defined) * 100)
    ) if total_defined > 0 else 0

    # payload de actividades
    activities_payload = []
    completed_ids_set = distinct_activity_ids

    for act in activities:
        activities_payload.append(
            {
                "id": act.id,
                "name": act.name,
                "description": act.description,
                "type": act.type,
                "distance_km": float(act.distance_km) if act.distance_km is not None else None,
                "difficulty": act.difficulty,
                "completed": act.id in completed_ids_set,
                "lat": float(act.lat) if act.lat is not None else None,
                "lng": float(act.lng) if act.lng is not None else None,
            }
        )

    return {
        "city": {
            "id": city.id,
            "name": city.name,
            "country": city.country,
            "slug": city.slug,
        },
        "stats": {
            "total_activities_defined": total_defined,
            "distinct_activities_completed": distinct_completed,
            "total_completions": total_completions,
            "total_distance_km": total_distance_km,
            "total_duration_sec": int(total_duration_sec),
            "progress_percentage": progress_percentage,
        },
        "activities": activities_payload,
    }


@bp.get("/<int:city_id>/progress")
@token_required
def get_city_progress(current_user, city_id):
    """
    Devuelve el progreso del usuario autenticado en la ciudad <city_id>.
    """
    payload = calculate_user_city_progress(current_user.id, city_id)
    return jsonify(payload), 200

@bp.get("/<int:city_id>/friends-leaderboard")
@token_required
def friends_leaderboard(current_user, city_id):
    """
    Ranking de progreso en una ciudad entre:
    - el usuario actual
    - y los usuarios que se siguen mutuamente con él.
    """
    # Asegura que la ciudad existe
    City.query.get_or_404(city_id)

    # IDs de seguidores y seguidos
    followers_ids = {u.id for u in current_user.followers}
    following_ids = {u.id for u in current_user.following}

    # Amigos mutuos = intersección
    mutual_ids = followers_ids & following_ids

    # Opcional: incluimos al propio usuario en el ranking
    mutual_ids.add(current_user.id)

    if not mutual_ids:
        return jsonify([]), 200

    # Cargamos los usuarios de una vez
    friends = User.query.filter(User.id.in_(mutual_ids)).all()
    id_to_user = {u.id: u for u in friends}

    results = []

    for uid in mutual_ids:
        user = id_to_user.get(uid)
        if not user:
            continue

        progress_payload = calculate_user_city_progress(uid, city_id)
        stats = progress_payload["stats"]

        results.append(
            {
                "user_id": user.id,
                "username": user.username,
                "name": user.name,
                "avatarUrl": user.avatar_url,
                "progress_percentage": stats["progress_percentage"],
                "distinct_activities_completed": stats[
                    "distinct_activities_completed"
                ],
                "total_distance_km": stats["total_distance_km"],
                "total_completions": stats["total_completions"],
            }
        )

    # Orden: primero más progreso, luego más km
    results.sort(
        key=lambda x: (-x["progress_percentage"], -x["total_distance_km"])
    )

    return jsonify(results), 200


@bp.get("/my")
@token_required
def get_my_cities(current_user):
    """
    Devuelve la lista de ciudades en las que el usuario tiene alguna actividad,
    junto con su porcentaje de progreso en cada una.
    Formato:
    [
      { "id": 1, "name": "Barcelona", "progress_percentage": 40 },
      ...
    ]
    """
    # Buscar todas las city_id donde el usuario tenga al menos una UserActivity
    city_ids_rows = (
        db.session.query(Activity.city_id)
        .join(UserActivity, UserActivity.activity_id == Activity.id)
        .filter(UserActivity.user_id == current_user.id)
        .distinct()
        .all()
    )
    city_ids = [row[0] for row in city_ids_rows]

    if not city_ids:
        return jsonify([]), 200

    # Para cada ciudad, reutilizamos calculate_user_city_progress
    result = []
    for cid in city_ids:
        progress_payload = calculate_user_city_progress(current_user.id, cid)
        result.append(
            {
                "id": progress_payload["city"]["id"],
                "name": progress_payload["city"]["name"],
                "progress_percentage": progress_payload["stats"]["progress_percentage"],
            }
        )

    # Devolvemos la lista
    return jsonify(result), 200

@bp.get("/")
def list_cities():
    """
    Devuelve todas las ciudades disponibles.
    """
    cities = City.query.order_by(City.name.asc()).all()
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "country": c.country,
            "slug": c.slug,
        }
        for c in cities
    ]), 200
