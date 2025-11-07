from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .config import Config
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    # Importa modelos para que Alembic los detecte
    from app.models import User, Post, follow
    from app.routes.auth import bp as auth_bp

    migrate.init_app(app, db)

    # Importa y registra blueprints con prefijo
    from app.routes import users, posts, comunity, event
    app.register_blueprint(users.bp)
    app.register_blueprint(posts.bp)
    app.register_blueprint(comunity.bp)
    app.register_blueprint(event.bp)
    app.register_blueprint(auth_bp)


    return app
