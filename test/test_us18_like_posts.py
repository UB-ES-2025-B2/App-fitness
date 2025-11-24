import pytest
from conftest import create_user, create_post, verify_user_email
import json


def authenticate(client, _db, email="likeuser@example.com", password="secret1"):
    """
    Helper: create + verify user + login + return token + user object.
    """
    user = create_user(
        _db,
        username="likeuser",
        name="Like User",
        email=email,
        password=password
    )
    assert verify_user_email(email)

    rv = client.post("/auth/login", json={"email": email, "password": password})
    assert rv.status_code == 200
    data = rv.get_json()
    token = data["access_token"]
    return token, user


def test_like_unlike_post(client, _db):
    """
    Validates POST /api/posts/<id>/like and DELETE /api/posts/<id>/like
    including idempotency.
    """
    token, user = authenticate(client, _db)
    post = create_post(_db, user_id=user.id, text="Hello world!")

    headers = {"Authorization": f"Bearer {token}"}

    rv = client.post(f"/api/posts/{post.id}/like", headers=headers)
    assert rv.status_code == 201  # new like
    data = rv.get_json()
    assert data["liked"] is True
    assert data["likes"] == 1

    rv2 = client.post(f"/api/posts/{post.id}/like", headers=headers)
    assert rv2.status_code == 200
    data2 = rv2.get_json()
    assert data2["liked"] is True
    assert data2["likes"] == 1  # unchanged

    rv3 = client.delete(f"/api/posts/{post.id}/like", headers=headers)
    assert rv3.status_code == 200
    data3 = rv3.get_json()
    assert data3["liked"] is False
    assert data3["likes"] == 0

    rv4 = client.delete(f"/api/posts/{post.id}/like", headers=headers)
    assert rv4.status_code == 200
    data4 = rv4.get_json()
    assert data4["liked"] is False
    assert data4["likes"] == 0


def test_my_liked_posts_endpoint(client, _db):
    """
    Validates GET /api/posts/me/likes returns only posts liked by this user.
    """
    token, user = authenticate(client, _db, email="likes2@example.com")
    p1 = create_post(_db, user_id=user.id, text="Post A")
    p2 = create_post(_db, user_id=user.id, text="Post B")
    p3 = create_post(_db, user_id=user.id, text="Post C")

    headers = {"Authorization": f"Bearer {token}"}

    client.post(f"/api/posts/{p1.id}/like", headers=headers)
    client.post(f"/api/posts/{p3.id}/like", headers=headers)

    rv = client.get("/api/posts/me/likes", headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)

    liked_ids = {item["id"] for item in data}

    assert p1.id in liked_ids
    assert p3.id in liked_ids

    assert p2.id not in liked_ids

    post_json = data[0]
    assert "id" in post_json
    assert "text" in post_json
    assert "topic" in post_json
    assert "user" in post_json
