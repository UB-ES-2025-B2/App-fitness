import pytest
from conftest import create_user, verify_user_email

def get_auth_header(client, email, password):
    resp = client.post('/auth/login', json={'email': email, 'password': password})
    data = resp.get_json()
    token = data['access_token']
    return {'Authorization': f'Bearer {token}'}

def test_follow_flow(client, _db):
    """
    US16: Test complete follow flow
    """
    # Create users
    u1 = create_user(_db, username='alice', name='Alice', email='alice@example.com')
    verify_user_email('alice@example.com')
    u2 = create_user(_db, username='bob', name='Bob', email='bob@example.com')
    verify_user_email('bob@example.com')
    u3 = create_user(_db, username='charlie', name='Charlie', email='charlie@example.com')

    # Login as Alice
    headers_alice = get_auth_header(client, 'alice@example.com', 'secret1')

    # Alice follows Bob
    rv = client.post(f'/api/users/{u2.id}/follow', headers=headers_alice)
    assert rv.status_code == 200
    assert rv.get_json()['is_following'] == True

    # Check Bob's followers
    rv = client.get(f'/api/users/{u2.id}/followers')
    followers = rv.get_json()
    assert len(followers) == 1
    assert followers[0]['username'] == 'alice'

    # Check Alice's following
    rv = client.get(f'/api/users/{u1.id}/following')
    following = rv.get_json()
    assert len(following) == 1
    assert following[0]['username'] == 'bob'

    # Check is_following flag in Bob's profile when viewed by Alice
    rv = client.get(f'/api/users/{u2.id}', headers=headers_alice)
    assert rv.status_code == 200
    assert rv.get_json()['is_following'] == True

    # Check is_following flag in Bob's profile when viewed by anonymous
    rv = client.get(f'/api/users/{u2.id}')
    assert rv.status_code == 200
    # is_following might be missing or False
    assert not rv.get_json().get('is_following')

    # Alice unfollows Bob
    rv = client.delete(f'/api/users/{u2.id}/follow', headers=headers_alice)
    assert rv.status_code == 200
    assert rv.get_json()['is_following'] == False

    # Check Bob's followers again
    rv = client.get(f'/api/users/{u2.id}/followers')
    assert len(rv.get_json()) == 0

    # Check is_following flag in Bob's profile when viewed by Alice
    rv = client.get(f'/api/users/{u2.id}', headers=headers_alice)
    assert rv.get_json()['is_following'] == False

def test_follow_multiple(client, _db):
    """
    US16: Test following multiple users
    """
    u1 = create_user(_db, username='user1', name='User 1', email='u1@test.com')
    verify_user_email('u1@test.com')
    u2 = create_user(_db, username='user2', name='User 2', email='u2@test.com')
    u3 = create_user(_db, username='user3', name='User 3', email='u3@test.com')

    headers = get_auth_header(client, 'u1@test.com', 'secret1')

    client.post(f'/api/users/{u2.id}/follow', headers=headers)
    client.post(f'/api/users/{u3.id}/follow', headers=headers)

    rv = client.get(f'/api/users/{u1.id}/following')
    following = rv.get_json()
    assert len(following) == 2
    usernames = [u['username'] for u in following]
    assert 'user2' in usernames
    assert 'user3' in usernames

def test_followers_following_structure(client, _db):
    """
    US16 Task 2: Verify structure of followers/following lists
    """
    u1 = create_user(_db, username='struct1', name='Struct User 1', email='s1@test.com', avatar_url='http://avatar.com/1.jpg')
    verify_user_email('s1@test.com')
    u2 = create_user(_db, username='struct2', name='Struct User 2', email='s2@test.com', avatar_url='http://avatar.com/2.jpg')

    headers = get_auth_header(client, 's1@test.com', 'secret1')
    client.post(f'/api/users/{u2.id}/follow', headers=headers)

    # Check followers of u2 (should contain u1)
    rv = client.get(f'/api/users/{u2.id}/followers')
    data = rv.get_json()
    assert len(data) == 1
    follower = data[0]
    assert 'id' in follower
    assert 'username' in follower
    assert 'name' in follower
    assert 'avatarUrl' in follower
    assert follower['username'] == 'struct1'
    assert follower['avatarUrl'] == 'http://avatar.com/1.jpg'

    # Check following of u1 (should contain u2)
    rv = client.get(f'/api/users/{u1.id}/following')
    data = rv.get_json()
    assert len(data) == 1
    followed = data[0]
    assert 'id' in followed
    assert 'username' in followed
    assert 'name' in followed
    assert 'avatarUrl' in followed
    assert followed['username'] == 'struct2'
    assert followed['avatarUrl'] == 'http://avatar.com/2.jpg'
