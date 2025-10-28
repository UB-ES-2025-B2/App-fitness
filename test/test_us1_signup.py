"""
US1 - Sign up
Acceptance criteria tested:
- Missing required fields return 400
- Password too short (less than 6) returns 400
- Name longer than 15 returns 400
- Duplicate email/username prevented
- Successful registration returns 201 and includes access_token, refresh_token and user profile
"""

import pytest

import json


def test_missing_fields(client):
    # Missing username/name/email/password
    rv = client.post('/auth/register', json={})
    assert rv.status_code == 400
    data = rv.get_json()
    assert 'Faltan campos' in data.get('error', '')


def test_short_password(client):
    payload = {"username": "u1", "name": "n1", "email": "e1@example.com", "password": "123"}
    rv = client.post('/auth/register', json=payload)
    assert rv.status_code == 400
    assert 'contraseña' in rv.get_json().get('error', '').lower()


def test_long_name(client):
    payload = {"username": "u2", "name": "a" * 20, "email": "e2@example.com", "password": "123456"}
    rv = client.post('/auth/register', json=payload)
    assert rv.status_code == 400
    assert 'nombre' in rv.get_json().get('error', '').lower()


def test_success_and_uniqueness(client, _db):
    payload = {"username": "uniqueuser", "name": "Name1", "email": "unique@example.com", "password": "secret1"}
    rv = client.post('/auth/register', json=payload)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data.get('access_token')
    assert data.get('refresh_token')
    assert data.get('user')

    # Try to register with same email
    payload2 = {"username": "another", "name": "Name2", "email": "unique@example.com", "password": "secret2"}
    rv2 = client.post('/auth/register', json=payload2)
    assert rv2.status_code == 400

    # Try to register with same username
    payload3 = {"username": "uniqueuser", "name": "Name3", "email": "unique3@example.com", "password": "secret3"}
    rv3 = client.post('/auth/register', json=payload3)
    assert rv3.status_code == 400
