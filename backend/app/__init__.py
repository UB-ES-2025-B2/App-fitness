from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .config import Config
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-key')

    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)  

    from .routes import users, auth
    app.register_blueprint(users.bp)
    app.register_blueprint(auth.bp)



    return app
