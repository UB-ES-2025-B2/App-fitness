import pytest

from conftest import create_user, create_post, verify_user_email

def _login_and_get_token(client, email: str, password: str) -> str:
    """
    Hace login vía /auth/login y devuelve el access token
    """
    rv = client.post("/auth/login", json={"email": email, "password": password})
    assert rv.status_code == 200
    data = rv.get_json()
    assert "access_token" in data
    return data["access_token"]

def _authenticated_user(client, _db, *, email: str, username: str, password: str = "app-fitness1"):
    """
    Crea un usuario, verifica su correo, hace login y devuelve
    """
    user = create_user(
        _db,
        username=username,
        name=username,
        email=email,
        password=password,
    )

    assert verify_user_email(email)

    token = _login_and_get_token(client, email, password)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers

def test_bookmark_unbookmark_post(client, _db):
    """
    Valida POST /api/posts/<id>/bookmark y DELETE /api/posts/<id>/bookmark,
    - POST siempre devuelve {"bookmarked": True}, 200.
    - DELETE siempre devuelve {"bookmarked": False}, 200.
    """
    user, headers = _authenticated_user(
        client,
        _db,
        email="bookmark@example.com",
        username="bookmarkuser",
    )

    post = create_post(_db, user_id=user.id, text="Post para guardar / bookmark")

    rv = client.post(f"/api/posts/{post.id}/bookmark", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, dict)
    assert data.get("bookmarked") is True

    rv2 = client.post(f"/api/posts/{post.id}/bookmark", headers=headers)
    assert rv2.status_code == 200
    data2 = rv2.get_json()
    assert isinstance(data2, dict)
    assert data2.get("bookmarked") is True

    rv3 = client.delete(f"/api/posts/{post.id}/bookmark", headers=headers)
    assert rv3.status_code == 200
    data3 = rv3.get_json()
    assert isinstance(data3, dict)
    assert data3.get("bookmarked") is False

    rv4 = client.delete(f"/api/posts/{post.id}/bookmark", headers=headers)
    assert rv4.status_code == 200
    data4 = rv4.get_json()
    assert isinstance(data4, dict)
    assert data4.get("bookmarked") is False

def test_bookmark_requires_authentication(client, _db):
    """
    Asegura que no se pueda guardar un post sin token
    """
    user = create_user(
        _db,
        username="noauthuser",
        name="No Auth",
        email="noauth@example.com",
        password="pw",
    )
    post = create_post(_db, user_id=user.id, text="Post sin auth")

    rv = client.post(f"/api/posts/{post.id}/bookmark")
    assert rv.status_code in (401, 403)

def test_my_bookmarked_posts_endpoint(client, _db):
    """
    Valida que GET /api/users/<user_id>/bookmarks devuelve solo los posts
    que el usuario autenticado ha guardado, en orden
    """
    user, headers = _authenticated_user(
        client,
        _db,
        email="bookmark2@example.com",
        username="bookmarkuser2",
    )

    p1 = create_post(_db, user_id=user.id, text="Post 1 guardable")
    p2 = create_post(_db, user_id=user.id, text="Post 2 no guardado")
    p3 = create_post(_db, user_id=user.id, text="Post 3 guardable")

    other = create_user(
        _db,
        username="otherbookmarkuser",
        name="Other BookmarkUser",
        email="otherbookmark@example.com",
        password="pw",
    )
    p_other = create_post(_db, user_id=other.id, text="Post de otro usuario")

    client.post(f"/api/posts/{p1.id}/bookmark", headers=headers)
    client.post(f"/api/posts/{p3.id}/bookmark", headers=headers)

    rv = client.get(f"/api/users/{user.id}/bookmarks", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)

    bookmarked_ids = {item.get("id") for item in data}

    assert p1.id in bookmarked_ids
    assert p3.id in bookmarked_ids

    assert p2.id not in bookmarked_ids
    assert p_other.id not in bookmarked_ids

    first = data[0]
    assert "id" in first
    assert "text" in first
    assert "user" in first  

def test_cannot_view_other_users_bookmarks(client, _db):
    """
    Asegura que /api/users/<user_id>/bookmarks y que solo puedes ver tus propios guardados.
    """
    user1, headers1 = _authenticated_user(
        client,
        _db,
        email="u1@example.com",
        username="user1",
    )
    user2, headers2 = _authenticated_user(
        client,
        _db,
        email="u2@example.com",
        username="user2",
    )

    rv = client.get(f"/api/users/{user2.id}/bookmarks", headers=headers1)
    assert rv.status_code == 403
    data = rv.get_json()
    assert isinstance(data, dict)
    assert "error" in data

    rv2 = client.get(f"/api/users/{user2.id}/bookmarks", headers=headers2)
    assert rv2.status_code == 200
    data2 = rv2.get_json()
    assert isinstance(data2, list)
