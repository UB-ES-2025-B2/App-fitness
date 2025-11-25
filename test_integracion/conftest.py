import pytest
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from datetime import datetime
import pathlib
import traceback


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


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """On test failure, capture screenshot and page source (if driver fixture present).
    Artifacts will be written under `test_integracion/artifacts/` for later upload.
    """
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("driver")
        if driver:
            artifacts_dir = pathlib.Path(__file__).resolve().parent / "artifacts"
            artifacts_dir.mkdir(exist_ok=True)
            name = f"{item.nodeid.replace('/', '_').replace('::', '_') }"
            try:
                screenshot_path = artifacts_dir / f"{name}.png"
                driver.save_screenshot(str(screenshot_path))
            except Exception:
                # ensure we don't mask original failure
                traceback.print_exc()
            try:
                html_path = artifacts_dir / f"{name}.html"
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
            except Exception:
                traceback.print_exc()

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config['TESTING'] = True
    # Ensure URI is set (redundant but safe)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret'

    # Safety: ensure we won't accidentally drop a non-test DB
    db_url = os.environ.get('DATABASE_URL', '')
    def _is_test_db(url: str) -> bool:
        if not url:
            return False
        url_l = url.lower()
        if url_l.startswith('sqlite://'):
            return True
        if 'localhost' in url_l or '127.0.0.1' in url_l:
            return True
        return False

    if not _is_test_db(db_url):
        raise RuntimeError(f"Refusing to run test fixtures: unsafe DATABASE_URL='{db_url}'")

    # Create app context for DB operations (safe)
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