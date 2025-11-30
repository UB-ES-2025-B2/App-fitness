# app/routes/city.py
from flask import Blueprint, jsonify
from sqlalchemy import func

from app import db
from app.models import City, Activity, UserActivity
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
