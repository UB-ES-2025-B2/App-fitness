import pytest
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from datetime import datetime


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_PATH = os.path.join(ROOT, "backend")
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"

from app import create_app, db
from app.models import User, Post, EmailVerification

@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--headless=new")

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        pytest.skip(f"Skipping integration test: Chrome driver could not be initialized (Chrome might be missing). Error: {e}")
        return

    yield driver
    driver.quit()

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config['TESTING'] = True
    # Ensure URI is set (redundant but safe)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret'

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


def verify_user_email(email: str) -> bool:
    """
    Verifica el correo de un usuario.
    Crea EmailVerification si no existe.
    """
    user = User.query.filter_by(email=email).first()
    if not user:
        return False

    ev = EmailVerification.query.filter_by(user_id=user.id).first()

    # Si no existe, lo creamos
    if not ev:
        ev = EmailVerification(
            user_id=user.id,
            verified_at=datetime.utcnow(),
            last_sent_at=None,
            token_hash=None
        )
        db.session.add(ev)
    else:
        # Simplemente marcar como verificado
        ev.verified_at = datetime.utcnow()

    db.session.commit()
    return True