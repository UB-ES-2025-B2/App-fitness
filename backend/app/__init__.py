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

    migrate.init_app(app, db)

    # Importa y registra blueprints con prefijo
    from app.routes import users, posts
    app.register_blueprint(users.bp)
    app.register_blueprint(posts.bp)

    return app
