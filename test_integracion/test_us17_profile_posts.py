import json
import pytest
from datetime import datetime, timedelta

from backend.app.models.user_model import User
from conftest import create_user, create_post, verify_user_email
from backend.app.models import Post

def get_auth_headers_for_user(client, _db, *, email="creator@example.com", password="secret1"):
    """
    Crea (o reutiliza) un usuario, lo verifica y hace login para obtener
    cabeceras Authorization válidas para @token_required.
    """
    _db.session.rollback()

    # Reutilizar usuario si ya existe
    user = User.query.filter_by(email=email).first()
    if not user:
        user = create_user(_db, username="creator", name="Creator", email=email, password=password)

    # Verificar email
    assert verify_user_email(email)

    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200, login_res.get_data(as_text=True)

    data = login_res.get_json()
    access = data["access_token"]  
    headers = {
        "Authorization": f"Bearer {access}",
        "Content-Type": "application/json",
    }
    return user, headers



def test_create_post_ok(client, _db):
    user, headers = get_auth_headers_for_user(client, _db)

    payload = {
        "text": "Mi primer post",
        "topic": "Montaña",
        "image_url": "https://cloudinary.com/img.png",
    }

    rv = client.post("/api/posts/", data=json.dumps(payload), headers=headers)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data["text"] == "Mi primer post"
    assert data["topic"] == "Montaña"
    assert data.get("image") == "https://cloudinary.com/img.png" or data.get("image_url") == "https://cloudinary.com/img.png"


def test_create_post_requires_text(client, _db):
    _, headers = get_auth_headers_for_user(client, _db)

    payload = {"topic": "Fútbol"}  # sin text

    rv = client.post("/api/posts/", data=json.dumps(payload), headers=headers)
    assert rv.status_code == 400
    body = rv.get_json()
    assert body is not None
    assert "error" in body or "text" in (body.get("message") or "").lower()


def test_get_user_posts(client, _db):
    _db.session.rollback()

    user = create_user(_db, username="poster_us17", email="poster_us17@example.com")
    p1 = create_post(_db, user.id, topic="Montaña", text="Post 1")
    p2 = create_post(_db, user.id, topic="Fútbol", text="Post 2")

    rv = client.get(f"/api/users/{user.id}/posts")
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)
    ids = {p["id"] for p in data}
    assert p1.id in ids
    assert p2.id in ids


def test_user_does_not_receive_other_users_posts(client, _db):
    _db.session.rollback()

    u1 = create_user(_db, username="u1_us17", email="u1_us17@example.com")
    u2 = create_user(_db, username="u2_us17", email="u2_us17@example.com")

    p1 = create_post(_db, u1.id, topic="Montaña", text="Del user 1")
    p2 = create_post(_db, u2.id, topic="Fútbol", text="Del user 2")

    rv = client.get(f"/api/users/{u1.id}/posts")
    assert rv.status_code == 200
    data = rv.get_json()
    ids = {p["id"] for p in data}

    assert p1.id in ids
    assert p2.id not in ids


def test_post_to_dict_format(client, _db):
    _db.session.rollback()

    user = create_user(_db, username="u_post_dict_us17", email="u_post_dict_us17@example.com")
    post = create_post(
        _db,
        user_id=user.id,
        topic="Montaña",
        text="Texto de prueba",
        image_url="https://cloudinary.com/example.png",
    )

    d = post.to_dict()

    assert d["id"] == post.id
    assert d["text"] == "Texto de prueba"
    assert d.get("topic") == "Montaña"
    assert d.get("image") == "https://cloudinary.com/example.png"
    assert "date" in d 
    assert "user" in d
    assert d["user"]["id"] == user.id
    assert d["user"]["username"] == user.username
