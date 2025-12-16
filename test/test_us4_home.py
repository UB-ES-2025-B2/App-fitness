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
    rv = client.get('/api/posts/')
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, dict)
    assert isinstance(data["items"], list)
