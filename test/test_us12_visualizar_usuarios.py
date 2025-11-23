"""
US12 - Visualizar Otros Usuarios
Acceptance criteria tested:
1. Mostrar el perfil de otro usuario dando click al nombre de éste
2. Mostrar el perfil de otro usuario dando click a la imagen de éste
"""

import pytest
from conftest import create_user, create_post, verify_user_email

def get_auth_header(client, email, password):
    resp = client.post('/auth/login', json={'email': email, 'password': password})
    data = resp.get_json()
    token = data['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_get_user_profile_by_id(client, _db):
    """
    AC1 & AC2: Obtener perfil de usuario por ID
    Verifica que se puede acceder al perfil de un usuario y se devuelven todos los datos necesarios
    """
    # Crear un usuario de prueba
    user = create_user(
        _db,
        username='johndoe',
        name='John Doe',
        email='john@example.com',
        password='secret123',
        bio='Amante del fitness',
        avatar_url='https://example.com/avatar.jpg',
        ocultar_info=False
    )
    
    # Obtener el perfil del usuario
    rv = client.get(f'/api/users/{user.id}')
    assert rv.status_code == 200
    
    data = rv.get_json()
    assert data['id'] == user.id
    assert data['username'] == 'johndoe'
    assert data['name'] == 'John Doe'
    assert data['bio'] == 'Amante del fitness'
    assert data['avatarUrl'] == 'https://example.com/avatar.jpg'
    assert data['ocultarInfo'] == False
    assert 'createdAt' in data


def test_get_user_profile_not_found(client, _db):
    """
    Verifica que se devuelve 404 cuando el usuario no existe
    """
    rv = client.get('/api/users/99999')
    assert rv.status_code == 404


def test_get_user_posts(client, _db):
    """
    AC1 & AC2: Obtener las publicaciones de un usuario
    Verifica que se pueden ver todas las publicaciones de un usuario específico
    """
    # Crear usuario y posts
    user = create_user(_db, username='athlete', name='Athlete', email='athlete@example.com')
    
    post1 = create_post(_db, user.id, topic='Fútbol', text='Partido increíble hoy!', image_url='https://example.com/post1.jpg')
    post2 = create_post(_db, user.id, topic='Gym', text='Nueva rutina de pesas')
    post3 = create_post(_db, user.id, topic='Fútbol', text='Gol de último minuto!')
    
    # Obtener posts del usuario
    rv = client.get(f'/api/users/{user.id}/posts')
    assert rv.status_code == 200
    
    posts = rv.get_json()
    assert len(posts) == 3
    
    # Verificar que los posts están ordenados por fecha (más reciente primero)
    assert posts[0]['id'] == post3.id
    assert posts[1]['id'] == post2.id
    assert posts[2]['id'] == post1.id
    
    # Verificar contenido del primer post
    assert posts[0]['text'] == 'Gol de último minuto!'
    assert posts[0]['topic'] == 'Fútbol'
    assert 'date' in posts[0]


def test_get_user_posts_empty(client, _db):
    """
    Verifica que se devuelve una lista vacía si el usuario no tiene posts
    """
    user = create_user(_db, username='newuser', name='New User', email='new@example.com')
    
    rv = client.get(f'/api/users/{user.id}/posts')
    assert rv.status_code == 200
    
    posts = rv.get_json()
    assert len(posts) == 0
    assert isinstance(posts, list)


def test_get_user_followers(client, _db):
    """
    Verifica que se pueden obtener los seguidores de un usuario
    """
    user1 = create_user(_db, username='user1', name='User One', email='user1@example.com')
    user2 = create_user(_db, username='user2', name='User Two', email='user2@example.com')
    user3 = create_user(_db, username='user3', name='User Three', email='user3@example.com')
    
    # user2 y user3 siguen a user1
    user2.following.append(user1)
    user3.following.append(user1)
    _db.session.commit()
    
    rv = client.get(f'/api/users/{user1.id}/followers')
    assert rv.status_code == 200
    
    followers = rv.get_json()
    assert len(followers) == 2
    
    usernames = [f['username'] for f in followers]
    assert 'user2' in usernames
    assert 'user3' in usernames


def test_get_user_following(client, _db):
    """
    Verifica que se pueden obtener los usuarios que sigue un usuario
    """
    user1 = create_user(_db, username='follower', name='Follower', email='follower@example.com')
    user2 = create_user(_db, username='followed1', name='Followed One', email='followed1@example.com')
    user3 = create_user(_db, username='followed2', name='Followed Two', email='followed2@example.com')
    
    # user1 sigue a user2 y user3
    user1.following.append(user2)
    user1.following.append(user3)
    _db.session.commit()
    
    rv = client.get(f'/api/users/{user1.id}/following')
    assert rv.status_code == 200
    
    following = rv.get_json()
    assert len(following) == 2
    
    names = [f['name'] for f in following]
    assert 'Followed One' in names
    assert 'Followed Two' in names


def test_follow_user(client, _db):
    """
    Verifica que un usuario puede seguir a otro
    """
    user1 = create_user(_db, username='me', name='Me', email='me@example.com')
    verify_user_email('me@example.com')
    user2 = create_user(_db, username='target', name='Target', email='target@example.com')
    
    headers = get_auth_header(client, 'me@example.com', 'secret1')

    # user1 sigue a user2
    rv = client.post(f'/api/users/{user2.id}/follow', headers=headers)
    assert rv.status_code == 200
    
    data = rv.get_json()
    assert data.get('ok') == True
    
    # Verificar que user2 ahora tiene 1 seguidor
    rv_followers = client.get(f'/api/users/{user2.id}/followers')
    followers = rv_followers.get_json()
    assert len(followers) == 1
    assert followers[0]['id'] == user1.id


def test_follow_user_twice(client, _db):
    """
    Verifica que seguir a un usuario dos veces no duplica el seguimiento
    """
    user1 = create_user(_db, username='u1', name='U1', email='u1@example.com')
    verify_user_email('u1@example.com')
    user2 = create_user(_db, username='u2', name='U2', email='u2@example.com')
    
    headers = get_auth_header(client, 'u1@example.com', 'secret1')

    # Seguir la primera vez
    client.post(f'/api/users/{user2.id}/follow', headers=headers)
    
    # Seguir la segunda vez
    rv = client.post(f'/api/users/{user2.id}/follow', headers=headers)
    assert rv.status_code == 200
    
    # Verificar que solo hay 1 seguidor
    rv_followers = client.get(f'/api/users/{user2.id}/followers')
    followers = rv_followers.get_json()
    assert len(followers) == 1


def test_follow_self_fails(client, _db):
    """
    Verifica que un usuario no puede seguirse a sí mismo
    """
    user = create_user(_db, username='myself', name='Myself', email='myself@example.com')
    verify_user_email('myself@example.com')
    
    headers = get_auth_header(client, 'myself@example.com', 'secret1')

    rv = client.post(f'/api/users/{user.id}/follow', headers=headers)
    assert rv.status_code == 400


def test_unfollow_user(client, _db):
    """
    Verifica que un usuario puede dejar de seguir a otro
    """
    user1 = create_user(_db, username='follower1', name='Follower', email='follower1@example.com')
    verify_user_email('follower1@example.com')
    user2 = create_user(_db, username='followed', name='Followed', email='followed@example.com')
    
    headers = get_auth_header(client, 'follower1@example.com', 'secret1')

    # user1 sigue a user2
    user1.following.append(user2)
    _db.session.commit()
    
    # Verificar que user2 tiene 1 seguidor
    rv_before = client.get(f'/api/users/{user2.id}/followers')
    assert len(rv_before.get_json()) == 1
    
    # user1 deja de seguir a user2
    rv = client.delete(f'/api/users/{user2.id}/follow', headers=headers)
    assert rv.status_code == 200
    
    # Verificar que user2 ahora tiene 0 seguidores
    rv_after = client.get(f'/api/users/{user2.id}/followers')
    assert len(rv_after.get_json()) == 0


def test_filter_posts_by_topic(client, _db):
    """
    AC1 & AC2: Verifica que las publicaciones se pueden filtrar por tema
    (El filtrado se hace en el frontend, pero verificamos que los datos están disponibles)
    """
    user = create_user(_db, username='sporty', name='Sporty', email='sporty@example.com')
    
    create_post(_db, user.id, topic='Fútbol', text='Post 1')
    create_post(_db, user.id, topic='Gym', text='Post 2')
    create_post(_db, user.id, topic='Fútbol', text='Post 3')
    create_post(_db, user.id, topic='Yoga', text='Post 4')
    
    # Obtener todos los posts
    rv = client.get(f'/api/users/{user.id}/posts')
    posts = rv.get_json()
    
    # Verificar que cada post tiene un topic
    for post in posts:
        assert 'topic' in post
        assert post['topic'] in ['Fútbol', 'Gym', 'Yoga']
    
    # Contar posts por tema (simulando filtrado frontend)
    futbol_posts = [p for p in posts if p['topic'] == 'Fútbol']
    gym_posts = [p for p in posts if p['topic'] == 'Gym']
    yoga_posts = [p for p in posts if p['topic'] == 'Yoga']
    
    assert len(futbol_posts) == 2
    assert len(gym_posts) == 1
    assert len(yoga_posts) == 1


def test_complete_user_profile_scenario(client, _db):
    """
    Escenario completo: verificar que se puede visualizar el perfil completo de un usuario
    incluyendo posts, seguidores y seguidos
    """
    # Crear usuarios
    target_user = create_user(
        _db,
        username='targetuser999',
        name='Target User',
        email='target999@example.com',
        bio='Entrenador personal',
        avatar_url='https://example.com/avatar.jpg'
    )
    follower1 = create_user(_db, username='follower999_1', name='Follower 1', email='f999_1@example.com')
    follower2 = create_user(_db, username='follower999_2', name='Follower 2', email='f999_2@example.com')
    following1 = create_user(_db, username='following999_1', name='Following 1', email='fol999_1@example.com')
    
    # Establecer relaciones
    follower1.following.append(target_user)
    follower2.following.append(target_user)
    target_user.following.append(following1)
    _db.session.commit()
    
    # Crear posts
    create_post(_db, target_user.id, topic='Gym', text='Nueva rutina')
    create_post(_db, target_user.id, topic='Nutrición', text='Receta saludable')
    
    # 1. Obtener perfil
    rv_profile = client.get(f'/api/users/{target_user.id}')
    assert rv_profile.status_code == 200
    profile = rv_profile.get_json()
    assert profile['username'] == 'targetuser999'
    assert profile['bio'] == 'Entrenador personal'
    
    # 2. Obtener posts
    rv_posts = client.get(f'/api/users/{target_user.id}/posts')
    assert rv_posts.status_code == 200
    posts = rv_posts.get_json()
    assert len(posts) == 2
    
    # 3. Obtener seguidores
    rv_followers = client.get(f'/api/users/{target_user.id}/followers')
    assert rv_followers.status_code == 200
    followers = rv_followers.get_json()
    assert len(followers) == 2
    
    # 4. Obtener seguidos
    rv_following = client.get(f'/api/users/{target_user.id}/following')
    assert rv_following.status_code == 200
    following = rv_following.get_json()
    assert len(following) == 1
    
    # Verificación completa: todos los datos necesarios para mostrar el perfil están disponibles
    assert all(key in profile for key in ['id', 'username', 'name', 'bio', 'avatarUrl', 'createdAt'])
    assert all(key in posts[0] for key in ['id', 'text', 'topic', 'image', 'date'])
    assert all(key in followers[0] for key in ['id', 'username', 'name', 'avatarUrl'])
