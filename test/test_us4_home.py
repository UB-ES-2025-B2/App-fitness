"""
US4 - Home Page
Acceptance criteria tested (backend):
- GET posts list returns posts in expected shape
- GET posts by user returns posts
"""

import pytest

from conftest import create_user, create_post


def test_posts_endpoints(client, _db):
    # Initially empty
    rv = client.get('/api/posts/')
    assert rv.status_code == 200
    assert isinstance(rv.get_json(), list)

    user = create_user(_db, username='poster', name='Poster', email='poster@example.com', password='p')
    p = create_post(_db, user.id, topic='nutrition', text='Eat well')

    rv2 = client.get('/api/posts/')
    data = rv2.get_json()
    assert any(item.get('id') == p.id for item in data)

    rv_user = client.get(f'/api/posts/user/{user.id}')
    assert rv_user.status_code == 200
    data_user = rv_user.get_json()
    assert len(data_user) >= 1
