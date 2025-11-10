"""
US3 - Determinar preferencias de temáticas
Acceptance criteria tested:
- GET preferences returns list
- POST preferences adds and avoids duplicates
- POST invalid payload returns 400
"""

import pytest

from conftest import create_user


def test_get_and_post_preferences(client, _db):
    user = create_user(_db, username='prefuser', name='PUser', email='pref@example.com', password='prefpwd')
    # GET initially empty
    rv = client.get(f'/api/users/{user.id}/preferences')
    assert rv.status_code == 200
    assert isinstance(rv.get_json().get('preferences'), list)

    # POST add preferences
    rv2 = client.post(f'/api/users/{user.id}/preferences', json={'preferences': ['nutrition', 'fitness']})
    assert rv2.status_code == 200
    # GET should reflect added (order not guaranteed)
    rv3 = client.get(f'/api/users/{user.id}/preferences')
    prefs = rv3.get_json().get('preferences')
    assert 'nutrition' in prefs and 'fitness' in prefs

    # POST duplicate should not duplicate entries
    rv4 = client.post(f'/api/users/{user.id}/preferences', json={'preferences': ['nutrition', 'yoga']})
    assert rv4.status_code == 200
    rv5 = client.get(f'/api/users/{user.id}/preferences')
    prefs2 = rv5.get_json().get('preferences')
    assert prefs2.count('nutrition') == 1
    assert 'yoga' in prefs2


def test_post_invalid_payload(client, _db):
    user = create_user(_db, username='prefuser2', name='P2', email='pref2@example.com', password='pass')
    rv = client.post(f'/api/users/{user.id}/preferences', json={'preferences': 'not-a-list'})
    assert rv.status_code == 400
    assert 'preferencias' in rv.get_json().get('error', '').lower()
