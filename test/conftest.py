import os
import sys
import pytest
from datetime import datetime

# Ensure backend package is importable
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_PATH = os.path.join(ROOT, 'backend')
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

from app.models.email_verification import EmailVerification

# Ensure the application uses an in-memory SQLite DB for tests.
# Must be set before importing the Flask app/config so Config picks it up.
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['SECRET_KEY'] = 'test-secret'

from app import create_app, db
from app.models.user_model import User
from app.models.post_model import Post

# Safety: avoid running tests that would drop a non-test database.
DB_URL = os.environ.get('DATABASE_URL', '')
def _is_test_db(url: str) -> bool:
    if not url:
        return False
    url_l = url.lower()
    # Allow in-memory sqlite and local sqlite files
    if url_l.startswith('sqlite://'):
        return True
    # Treat localhost references as test (best-effort)
    if 'localhost' in url_l or '127.0.0.1' in url_l:
        return True
    return False

if not _is_test_db(DB_URL):
    # Prevent accidental destructive operations on production DB
    raise RuntimeError(f"Refusing to run test fixtures: unsafe DATABASE_URL='{DB_URL}'")


@pytest.fixture(scope='function')
def app():
    app = create_app({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'TESTING': True,
        'SECRET_KEY': 'test-secret',
        'FRONTEND_BASE_URL': 'http://localhost:3000'
    })
    
    # Create app context for DB operations
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def _db(app):
    return db


# Helpers
def create_user(_db, username='testuser', name='Test', email='test@example.com', password='secret1', **kwargs):
    user = User(
        username=username,
        name=name,
        email=email,
        avatar_url=kwargs.get('avatar_url'),
        bio=kwargs.get('bio'),
        ocultar_info=kwargs.get('ocultar_info', True),
        preferences=kwargs.get('preferences', []),
    )
    user.set_password(password)
    _db.session.add(user)
    _db.session.commit()
    return user


def create_post(_db, user_id, topic='general', text='hello', image_url=None):
    p = Post(user_id=user_id, topic=topic, text=text, image_url=image_url)
    _db.session.add(p)
    _db.session.commit()
    return p


def verify_user_email(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return False
    ev = EmailVerification(user_id=user.id, verified_at=datetime.utcnow())
    db.session.add(ev)
    db.session.commit()
    return True

