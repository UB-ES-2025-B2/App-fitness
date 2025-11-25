"""
US2 - Log in
Acceptance criteria tested:
- Successful login with email returns tokens and user info
- Successful login with name also works
- Invalid credentials return 401
"""

import pytest
from conftest import create_user
from app.models.email_verification import EmailVerification
from datetime import datetime


def verify_user(_db, user):
    ev = EmailVerification(user_id=user.id, verified_at=datetime.utcnow())
    _db.session.add(ev)
    _db.session.commit()


def test_login_with_email(client, _db):
    user = create_user(_db, username='u_login', name='LoginName', email='login@example.com', password='mypwd1')
    verify_user(_db, user)
    rv = client.post('/auth/login', json={"email": "login@example.com", "password": "mypwd1"})
    assert rv.status_code == 200
    d = rv.get_json()
    assert d.get('access_token')
    assert d.get('refresh_token')
    assert d.get('user')


def test_login_with_name(client, _db):
    user = create_user(_db, username='u_login2', name='NameLogin', email='login2@example.com', password='pass123')
    verify_user(_db, user)
    rv = client.post('/auth/login', json={"email": "NameLogin", "password": "pass123"})
    assert rv.status_code == 200
    d = rv.get_json()
    assert d.get('user')['name'] == 'NameLogin'


def test_invalid_credentials(client, _db):
    create_user(_db, username='u3', name='N3', email='e3@example.com', password='goodpwd')
    rv = client.post('/auth/login', json={"email": "e3@example.com", "password": "bad"})
    assert rv.status_code == 401
    assert 'Credenciales' in rv.get_json().get('error', '')
