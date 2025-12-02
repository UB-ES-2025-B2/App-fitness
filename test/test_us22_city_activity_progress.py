import jwt
import pytest
from datetime import datetime, timedelta

from app.models import City, Activity, UserActivity, User


# Helpers locales para este módulo
def create_user(_db, username="user1", name="User One", email="user1@example.com", password="secret1"):
    from app.models.user_model import User as UserModel

    user = UserModel(
        username=username,
        name=name,
        email=email,
        avatar_url=None,
        bio=None,
        ocultar_info=True,
        preferences=[],
    )
    user.set_password(password)
    _db.session.add(user)
    _db.session.commit()
    return user


def make_token(app, user_id: int) -> str:
    secret = app.config.get("JWT_SECRET_KEY") or app.config["SECRET_KEY"]
    return jwt.encode({"user_id": user_id}, secret, algorithm="HS256")


def create_city(_db, name="Barcelona", country="España", slug="barcelona"):
    city = City(name=name, country=country, slug=slug)
    _db.session.add(city)
    _db.session.commit()
    return city


def create_activity(
    _db,
    city_id: int,
    name: str = "Actividad 1",
    type_: str = "Montaña",
    distance_km: float = 5.0,
    difficulty: str = "easy",
    is_active: bool = True,
):
    act = Activity(
        city_id=city_id,
        name=name,
        type=type_,
        distance_km=distance_km,
        difficulty=difficulty,
        is_active=is_active,
    )
    _db.session.add(act)
    _db.session.commit()
    return act


# ------------- TESTS /api/activities/<id>/complete -----------------


def test_complete_activity_creates_useractivity(client, _db, app):
    """Completar una actividad crea un registro en user_activity y devuelve 201."""
    user = create_user(_db)
    city = create_city(_db)
    act = create_activity(_db, city_id=city.id, name="Subida a Montjuïc")

    token = make_token(app, user.id)
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.post(f"/api/activities/{act.id}/complete", headers=headers)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data["activity_id"] == act.id
    assert "Actividad completada" in data["message"]

    # En base de datos debe haber exactamente un UserActivity
    ua_rows = UserActivity.query.filter_by(user_id=user.id, activity_id=act.id).all()
    assert len(ua_rows) == 1
    assert isinstance(ua_rows[0].done_at, datetime)


def test_complete_activity_not_found(client, _db, app):
    """Completar una actividad inexistente devuelve 404."""
    user = create_user(_db)
    token = make_token(app, user.id)
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.post("/api/activities/9999/complete", headers=headers)
    assert rv.status_code == 404
    assert "Actividad no encontrada" in rv.get_json().get("error", "")


# ------------- TESTS /api/cities/<id>/progress -----------------


def test_city_progress_basic_stats(client, _db, app):
    """
    Calcula correctamente:
    - total_activities_defined
    - distinct_activities_completed
    - total_completions
    - total_distance_km
    - progress_percentage
    """
    user = create_user(_db, username="runner1", email="runner1@example.com")
    city = create_city(_db, name="Barcelona", slug="barcelona")

    # 3 actividades activas
    a1 = create_activity(_db, city_id=city.id, name="Act 1", distance_km=5.0)
    a2 = create_activity(_db, city_id=city.id, name="Act 2", distance_km=10.0)
    a3 = create_activity(_db, city_id=city.id, name="Act 3", distance_km=7.5)

    # Usuario completa:
    # - a1 una vez
    # - a2 dos veces
    now = datetime.utcnow()
    _db.session.add_all(
        [
            UserActivity(user_id=user.id, activity_id=a1.id, done_at=now),
            UserActivity(user_id=user.id, activity_id=a2.id, done_at=now),
            UserActivity(user_id=user.id, activity_id=a2.id, done_at=now + timedelta(minutes=5)),
        ]
    )
    _db.session.commit()

    token = make_token(app, user.id)
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.get(f"/api/cities/{city.id}/progress", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()

    stats = data["stats"]
    assert stats["total_activities_defined"] == 3
    assert stats["distinct_activities_completed"] == 2
    assert stats["total_completions"] == 3

    # distance_km suma por cada completación (5 + 10 + 10 = 25.0)
    assert stats["total_distance_km"] == pytest.approx(25.0)

    # progreso = 2 / 3 ≃ 66.7 → 67
    assert stats["progress_percentage"] == 67

    # payload de actividades incluye completed correcto
    acts = {a["id"]: a for a in data["activities"]}
    assert acts[a1.id]["completed"] is True
    assert acts[a2.id]["completed"] is True
    assert acts[a3.id]["completed"] is False


def test_city_progress_no_activities_returns_zeros(client, _db, app):
    """Si la ciudad no tiene actividades activas, todos los contadores son 0."""
    user = create_user(_db)
    city = create_city(_db, name="Ciudad sin actividades", slug="empty-city")

    token = make_token(app, user.id)
    headers = {"Authorization": f"Bearer {token}"}
    rv = client.get(f"/api/cities/{city.id}/progress", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    stats = data["stats"]

    assert stats["total_activities_defined"] == 0
    assert stats["distinct_activities_completed"] == 0
    assert stats["total_completions"] == 0
    assert stats["total_distance_km"] == 0.0
    assert stats["total_duration_sec"] == 0
    assert stats["progress_percentage"] == 0
    assert data["activities"] == []


# ------------- TESTS /api/cities/my -----------------


def test_my_cities_only_with_user_activity(client, _db, app):
    """Solo devuelve ciudades en las que el usuario tiene UserActivity."""
    user = create_user(_db, username="multiuser", email="multi@example.com")

    city1 = create_city(_db, name="Barcelona", slug="barcelona")
    city2 = create_city(_db, name="Madrid", slug="madrid")
    # ciudad3 sin actividades/usos
    city3 = create_city(_db, name="Girona", slug="girona")

    a1 = create_activity(_db, city_id=city1.id, name="Act Bcn")
    a2 = create_activity(_db, city_id=city2.id, name="Act Mad")

    now = datetime.utcnow()
    _db.session.add_all(
        [
            UserActivity(user_id=user.id, activity_id=a1.id, done_at=now),
            UserActivity(user_id=user.id, activity_id=a2.id, done_at=now),
        ]
    )
    _db.session.commit()

    token = make_token(app, user.id)
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.get("/api/cities/my", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()

    ids = {c["id"] for c in data}
    assert city1.id in ids
    assert city2.id in ids
    assert city3.id not in ids  # no hay actividades del usuario en esta ciudad


# ------------- TESTS /api/cities/<id>/friends-leaderboard -----------------


def test_friends_leaderboard_mutual_only_and_sorted(client, _db, app):
    """
    Ranking incluye:
    - usuario actual
    - solo amigos con follow mutuo
    y está ordenado por progreso (y luego por km).
    """
    # Usuarios
    me = create_user(_db, username="yo", email="yo@example.com")
    friend = create_user(_db, username="amigo", email="amigo@example.com")
    not_mutual = create_user(_db, username="one_way", email="oneway@example.com")

    # Relaciones:
    # me ↔ friend (mutuo)
    me.following.append(friend)
    friend.following.append(me)

    # me → not_mutual (solo le sigo yo)
    me.following.append(not_mutual)
    _db.session.commit()

    city = create_city(_db, name="Barcelona", slug="barcelona")

    # Actividades
    a1 = create_activity(_db, city_id=city.id, name="Act 1", distance_km=5.0)
    a2 = create_activity(_db, city_id=city.id, name="Act 2", distance_km=10.0)

    now = datetime.utcnow()

    # Yo completo 1 actividad
    _db.session.add(UserActivity(user_id=me.id, activity_id=a1.id, done_at=now))

    # Friend completa 2 actividades (más progreso)
    _db.session.add_all(
        [
            UserActivity(user_id=friend.id, activity_id=a1.id, done_at=now),
            UserActivity(user_id=friend.id, activity_id=a2.id, done_at=now),
        ]
    )

    # not_mutual también hace cosas, pero no debería aparecer
    _db.session.add(
        UserActivity(user_id=not_mutual.id, activity_id=a1.id, done_at=now)
    )

    _db.session.commit()

    token = make_token(app, me.id)
    headers = {"Authorization": f"Bearer {token}"}

    rv = client.get(f"/api/cities/{city.id}/friends-leaderboard", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()

    # Solo yo y friend (mutuo)
    ids = [row["user_id"] for row in data]
    assert set(ids) == {me.id, friend.id}
    # Friend primero porque tiene más progreso
    assert data[0]["user_id"] == friend.id
    assert data[1]["user_id"] == me.id