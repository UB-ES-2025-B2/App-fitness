import pytest

from conftest import create_user, create_post, verify_user_email


def _login_and_get_token(client, email: str, password: str) -> str:
    rv = client.post("/auth/login", json={"email": email, "password": password})
    assert rv.status_code == 200
    data = rv.get_json()
    assert "access_token" in data
    return data["access_token"]


def _authenticated_user(client, _db, *, email: str, username: str, password: str = "app-fitness1"):
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


def test_repost_and_unrepost(client, _db):
    user_a = create_user(
        _db, 
        username="creador", 
        name="Creador A", 
        email="creador@repost.com", 
        password="pw"
    )
    user_b, headers_b = _authenticated_user(
        client,
        _db,
        email="reposter@repost.com",
        username="reposter_b",
    )
    
    post = create_post(_db, user_id=user_a.id, text="Post original per repost")

    repost_comment = "Gran post!"
    rv = client.post(
        f"/api/posts/{post.id}/repost", 
        headers=headers_b, 
        json={"comment_text": repost_comment}
    )
    assert rv.status_code == 201
    data = rv.get_json()
    assert data.get("message") == "Repost creat amb èxit!"

    from app.models import Post
    updated_post = Post.query.get(post.id)
    assert updated_post.repost_count == 1
    
    rv2 = client.post(
        f"/api/posts/{post.id}/repost", 
        headers=headers_b, 
        json={"comment_text": "Això és un segon intent"}
    )
    assert rv2.status_code == 200
    data2 = rv2.get_json()
    assert "ja ha estat reposteat" in data2.get("message")
    
    updated_post_2 = Post.query.get(post.id)
    assert updated_post_2.repost_count == 1


    rv3 = client.delete(f"/api/posts/{post.id}/repost", headers=headers_b)
    assert rv3.status_code == 200
    data3 = rv3.get_json()
    assert data3.get("message") == "Repost eliminat amb èxit!"
    
    updated_post_3 = Post.query.get(post.id)
    assert updated_post_3.repost_count == 0
    
    rv4 = client.delete(f"/api/posts/{post.id}/repost", headers=headers_b)
    assert rv4.status_code == 200
    data4 = rv4.get_json()
    assert "No hi ha cap Repost teu per eliminar" in data4.get("message")
    
    updated_post_4 = Post.query.get(post.id)
    assert updated_post_4.repost_count == 0


def test_repost_validations(client, _db):
    user, headers = _authenticated_user(
        client, 
        _db, 
        email="validator@repost.com", 
        username="validator"
    )
    
    post = create_post(_db, user_id=user.id, text="Post propi")

    rv_404 = client.post(f"/api/posts/99999/repost", headers=headers)
    assert rv_404.status_code == 404
    assert "no trobat" in rv_404.get_json().get("error")

    rv_self = client.post(f"/api/posts/{post.id}/repost", headers=headers)
    assert rv_self.status_code == 400
    assert "propi post" in rv_self.get_json().get("error")

    rv_delete_404 = client.delete(f"/api/posts/99999/repost", headers=headers)
    assert rv_delete_404.status_code == 404
    assert "no trobat" in rv_delete_404.get_json().get("error")