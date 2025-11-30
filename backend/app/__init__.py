from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

from app.routes import city
from .config import Config
from flask_migrate import Migrate
# from flask_mail import Mail

db = SQLAlchemy()
migrate = Migrate()
# mail = Mail()

def create_app(test_config=None):
    app = Flask(__name__)
    if test_config:
        app.config.from_mapping(test_config)
    else:
        app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)    
    # mail.init_app(app)

    # Importa models perquè Alembic els detecti
    from app.models import User, Post, follow
    from app.routes.auth import bp as auth_bp
    from app.routes import upload
    from .routes.search import bp as search_bp

    migrate.init_app(app, db)

    # Importa y registra blueprints con prefijo
    from app.routes import users, posts, comunity, event
    app.register_blueprint(users.bp)
    app.register_blueprint(posts.bp)
    app.register_blueprint(comunity.bp)
    app.register_blueprint(event.bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(upload.bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(city.bp)

    
    #  HOME VISUAL UB FITNESS 
    # ==============================
    @app.route("/")
    def home():
        html = """
        <html>
          <head>
            <title>UB Fitness - API</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f0f2f5;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              h1 {
                color: #2c3e50;
                font-size: 2.5em;
                margin-bottom: 20px;
              }
              ul {
                list-style: none;
                padding: 0;
              }
              li {
                margin: 10px 0;
              }
              a {
                text-decoration: none;
                color: #3498db;
                font-size: 1.2em;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <h1>Benvingut a la API de UB Fitness</h1>
            <ul>
              <li><a href="/auth/register">Endpoint de registre</a></li>
              <li><a href="/api/users/">Llista d'usuaris</a></li>
              <li><a href="/api/communities/">Llista de comunitats</a></li>
              <li><a href="/api/posts/">Llista de publicacions</a></li>
            </ul>
          </body>
        </html>
        """
        return html
  

    return app