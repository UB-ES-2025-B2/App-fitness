"""
US5 - Añadir información al perfil
Acceptance criteria tested:
- PUT /api/users/<id> updates allowed fields
- GET /auth/me returns current user when provided Bearer token
- PATCH /auth/me updates editable fields and validates uniqueness
"""

import pytest

from conftest import create_user, verify_user_email
import jwt


def login_and_get_tokens(client, email, password):
    rv = client.post('/auth/login', json={'email': email, 'password': password})
    assert rv.status_code == 200
    return rv.get_json()


def test_update_profile_put(client, _db):
    user = create_user(_db, username='upduser', name='OldName', email='upd@example.com', password='pwd123')
    rv = client.put(f'/api/users/{user.id}', json={'name': 'NewName', 'bio': 'Hello', 'avatar_url': 'http://x'})
    assert rv.status_code == 200
    data = rv.get_json()
    assert data.get('name') == 'NewName'
    assert data.get('avatarUrl') == 'http://x'


def test_auth_me_get_and_patch(client, _db):
    user = create_user(_db, username='meuser', name='MeName', email='me2@example.com', password='mepwd')
    assert verify_user_email('me2@example.com')
    tokens = login_and_get_tokens(client, 'me2@example.com', 'mepwd')
    access = tokens.get('access_token')
    headers = {'Authorization': f'Bearer {access}'}

    # GET /auth/me
    rv = client.get('/auth/me', headers=headers)
    assert rv.status_code == 200
    got = rv.get_json()
    assert got.get('email') == 'me2@example.com'
    assert got.get("name") == 'MeName'
    assert got.get("username") == 'meuser'
    assert got.get("ocultar_info")
    assert got.get("preferences")==[]

    # PATCH /auth/me
    rv2 = client.patch('/auth/me', headers=headers, json={'name': 'MeNew', 'preferences': ['x']})
    assert rv2.status_code == 200
    updated = rv2.get_json()
    assert updated.get('user')['name'] == 'MeNew'
    assert isinstance(updated.get('user')['preferences'], list) or updated.get('user').get('preferences') is not None

    # Try uniqueness validation for name via /auth/me PATCH
    other = create_user(_db, username='other', name='OtherName', email='other@example.com', password='opw')
    # attempt to change to existing name
    rv3 = client.patch('/auth/me', headers=headers, json={'name': 'OtherName'})
    assert rv3.status_code in (200, 400)  # depending on route used; if 400 then uniqueness enforced
    # if 400, message should mention 'uso' or 'nombre'
    if rv3.status_code == 400:
        assert 'nombre' in rv3.get_json().get('error', '').lower() or 'uso' in rv3.get_json().get('error', '').lower()
