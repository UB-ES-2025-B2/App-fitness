import pytest
from conftest import create_user, create_post
from app.models import Report, Post, User
from app.models.email_verification import EmailVerification
from datetime import datetime

# --- FUNCIONES AUXILIARES ---

def verify_user(_db, user):
    """Marca el usuario como verificado."""
    ev = EmailVerification(user_id=user.id, verified_at=datetime.utcnow())
    _db.session.add(ev)
    _db.session.commit()

def get_auth_header(client, email, password):
    """Obtiene la cabecera de autorización Bearer."""
    resp = client.post('/auth/login', json={'email': email, 'password': password})
    data = resp.get_json()
    token = data['access_token']
    return {'Authorization': f'Bearer {token}'}

# --- TESTS DE POSTS (ADHERIDOS AL BACKEND PROPORCIONADO) ---

def test_report_post_success(client, _db):
    """Test de denuncia de post con éxito (código 201)."""
    # 1. Preparación de datos
    u_reporter = create_user(_db, username='reporter', email='reporter@test.com')
    verify_user(_db, u_reporter)
    u_author = create_user(_db, username='author', email='author@test.com')
    post = create_post(_db, user_id=u_author.id, text="Contingut ofensiu", topic="General")
    
    headers_reporter = get_auth_header(client, 'reporter@test.com', 'secret1')
    
    report_data = {
        "category": "Contenido Inadecuado",
        "comment": "Contenido que promueve el odio."
    }
    
    # 2. Denunciar el post
    rv = client.post(f'/api/posts/{post.id}/report', headers=headers_reporter, json=report_data)
    
    # 3. Verificaciones
    assert rv.status_code == 201
    assert "Denúncia registrada correctament" in rv.get_json()['message']
    
    # Verifica que l'entrada existeix a la DB
    report_entry = Report.query.filter_by(post_id=post.id, reporting_user_id=u_reporter.id).first()
    assert report_entry is not None
    assert report_entry.category == report_data['category']
    assert report_entry.comment == report_data['comment']


def test_report_post_duplicate(client, _db):
    """Test que un usuario no puede denunciar el mismo post dos veces (código 409)."""
    # 1. Preparación de datos
    u_reporter = create_user(_db, username='reporter2', email='reporter2@test.com')
    verify_user(_db, u_reporter)
    u_author = create_user(_db, username='author2', email='author2@test.com')
    post = create_post(_db, user_id=u_author.id, text="Post duplicat", topic="General")
    
    headers_reporter = get_auth_header(client, 'reporter2@test.com', 'secret1')
    
    report_data = {"category": "Spam o Engaño"}
    
    # 2. Primer report (OK)
    client.post(f'/api/posts/{post.id}/report', headers=headers_reporter, json=report_data)
    
    # 3. Segon report (Debe fallar)
    rv = client.post(f'/api/posts/{post.id}/report', headers=headers_reporter, json=report_data)
    
    # 4. Verificaciones
    assert rv.status_code == 409
    assert "Ja has denunciat aquest contingut prèviament" in rv.get_json()['error']


def test_report_post_not_found(client, _db):
    """Test de denuncia a un post que no existeix (código 404)."""
    u_reporter = create_user(_db, username='reporter_nf', email='reporter_nf@test.com')
    verify_user(_db, u_reporter)
    headers_reporter = get_auth_header(client, 'reporter_nf@test.com', 'secret1')
    
    rv = client.post(f'/api/posts/99999/report', headers=headers_reporter, json={"category": "Altres"})
    
    assert rv.status_code == 404
    assert "Post no trobat" in rv.get_json()['error']


def test_report_post_missing_category(client, _db):
    """Test denuncia de post sense categoria (código 400)."""
    # 1. Preparación de datos
    u_reporter = create_user(_db, username='reporter3', email='reporter3@test.com')
    verify_user(_db, u_reporter)
    u_author = create_user(_db, username='author3', email='author3@test.com')
    post = create_post(_db, user_id=u_author.id, text="Post sense categoria", topic="General")
    
    headers_reporter = get_auth_header(client, 'reporter3@test.com', 'secret1')
    
    report_data_missing = {"comment": "Només un comentari"}
    
    # 2. Intent de denúncia sense categoria
    rv = client.post(f'/api/posts/{post.id}/report', headers=headers_reporter, json=report_data_missing)
    
    # 3. Verificaciones
    assert rv.status_code == 400
    assert "Falta el camp 'category' per a la denúncia" in rv.get_json()['error']


def test_report_post_unauthenticated(client, _db):
    """
    Test que un usuari no autenticat no pot denunciar (código 401).
    Se asume que el error de 401 tiene la clave 'msg' por defecto de Flask-JWT.
    """
    u_author = create_user(_db, username='author4', email='author4@test.com')
    post = create_post(_db, user_id=u_author.id, text="Post sense auth", topic="General")
    
    report_data = {"category": "Spam o Engaño"}
    
    # Intent de denúncia sense capçalera d'autorització
    rv = client.post(f'/api/posts/{post.id}/report', json=report_data)
    
    assert rv.status_code == 401
    
    # ⚠️ CORRECCIÓN DE KEY ERROR: Comprobar si 'msg' o 'error' existe. Usaremos 'msg' como estándar para JWT, pero la aserción debe ser segura.
    response_data = rv.get_json()
    assert 'msg' in response_data or 'error' in response_data
    # Podemos buscar la frase que esperamos en el valor de la clave 'msg' o 'error'
    assert 'Token faltante' in response_data.get('msg', response_data.get('error', ''))