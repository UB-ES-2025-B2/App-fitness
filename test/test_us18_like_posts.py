import pytest

from conftest import create_user, create_post, verify_user_email


def _login_and_get_token(client, email: str, password: str) -> str:
    """
    Hace login vía /auth/login y devuelve el access_token.
    """
    rv = client.post("/auth/login", json={"email": email, "password": password})
    assert rv.status_code == 200
    data = rv.get_json()
    assert "access_token" in data
    return data["access_token"]


def _authenticated_user(client, _db, *, email: str, username: str, password: str = "app-fitness1"):
    """
    Crea un usuario, verifica su correo, hace login y devuelve (user, headers).
    """
    user = create_user(
        _db,
        username=username,
        name=username,
        email=email,
        password=password,
    )

    # marcar email como verificado (como en otros tests)
    assert verify_user_email(email)

    token = _login_and_get_token(client, email, password)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def test_like_unlike_post(client, _db):
    """
    Valida POST /api/posts/<id>/like y DELETE /api/posts/<id>/like,
    incluyendo la idempotencia básica.
    """
    user, headers = _authenticated_user(
        client,
        _db,
        email="likes@example.com",
        username="likeuser",
    )

    post = create_post(_db, user_id=user.id, text="Hola mundo US18")

    # --- Dar like por primera vez ---
    rv = client.post(f"/api/posts/{post.id}/like", headers=headers)
    assert rv.status_code in (200, 201)
    data = rv.get_json()
    # Estructura esperada: {"liked": true, "likes": <int>}
    assert data.get("liked") is True
    assert isinstance(data.get("likes"), int)
    first_likes = data["likes"]
    assert first_likes >= 1

    # --- Repetir POST (idempotente: no debe incrementar infinitamente) ---
    rv2 = client.post(f"/api/posts/{post.id}/like", headers=headers)
    assert rv2.status_code in (200, 201)
    data2 = rv2.get_json()
    assert data2.get("liked") is True
    assert isinstance(data2.get("likes"), int)
    assert data2["likes"] == first_likes

    # --- Quitar like ---
    rv3 = client.delete(f"/api/posts/{post.id}/like", headers=headers)
    assert rv3.status_code in (200, 204)
    data3 = rv3.get_json() or {}

    # Si tu endpoint devuelve JSON:
    if data3:
        assert data3.get("liked") is False
        assert isinstance(data3.get("likes"), int)
        assert data3["likes"] <= first_likes

    # --- Repetir DELETE (idempotente) ---
    rv4 = client.delete(f"/api/posts/{post.id}/like", headers=headers)
    assert rv4.status_code in (200, 204)
    data4 = rv4.get_json() or {}
    if data4:
        assert data4.get("liked") is False


def test_my_liked_posts_endpoint(client, _db):
    """
    Valida que GET /api/posts/me/likes devuelve sólo los posts
    que el usuario actual ha marcado con "me gusta".
    """
    user, headers = _authenticated_user(
        client,
        _db,
        email="likes2@example.com",
        username="likeuser2",
    )

    # Posts del propio usuario
    p1 = create_post(_db, user_id=user.id, text="Post A")
    p2 = create_post(_db, user_id=user.id, text="Post B")
    p3 = create_post(_db, user_id=user.id, text="Post C")

    # Otro usuario con otro post que no debería aparecer
    other = create_user(
        _db,
        username="otheruser1",
        name="Other User1",
        email="other1@example.com",
        password="pw",
    )
    p_other = create_post(_db, user_id=other.id, text="Post de otro usuario")

    # Dar like sólo a p1 y p3
    client.post(f"/api/posts/{p1.id}/like", headers=headers)
    client.post(f"/api/posts/{p3.id}/like", headers=headers)

    rv = client.get("/api/posts/me/likes", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)

    liked_ids = {item.get("id") for item in data}

    # Deben estar los que hemos likeado
    assert p1.id in liked_ids
    assert p3.id in liked_ids

    # No deben estar los que no hemos likeado
    assert p2.id not in liked_ids
    assert p_other.id not in liked_ids

    # Chequeo básico de forma de respuesta
    first = data[0]
    assert "id" in first
    assert "text" in first
    assert "user" in first  # como en US4, se comprueba forma básica
    # Si en tu API topic es obligatorio, descomenta:
    # assert "topic" in first
