from sqlite3 import IntegrityError
from flask import Blueprint, request, jsonify, current_app

from ..utils.auth_utils import token_required
from ..models.user_model import User
from .. import db
import jwt
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    username = (data.get('username') or '').strip()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    avatar_url = data.get('avatar_url')
    bio = data.get('bio')
    ocultar_info = bool(data.get('ocultar_info', True))
    topics = data.get('topics') or []  # se guardan en preferences (JSON)

    # Validaciones mínimas
    if not username or not name or not email or not password:
        return jsonify({"error": "Faltan campos: username, name, email y password son obligatorios."}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres."}), 400
    if len(name) > 15:
        return jsonify({"error": "El nombre 'name' debe tener como máximo 15 caracteres."}), 400

    # Unicidad explícita (evita 500 feos antes del commit)
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El correo ya está registrado"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "El nombre de usuario ya está registrado"}), 400

    try:
        user = User(
            username=username,
            name=name,
            email=email,
            avatar_url=avatar_url,
            bio=bio,
            ocultar_info=ocultar_info,
            preferences=topics,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Usuario o email ya registrados"}), 400

    access_token = jwt.encode({
        "user_id": user.id, "type": "access",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
    refresh_token = jwt.encode({
        "user_id": user.id, "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Usuario creado correctamente",
        "user": user.to_profile_dict(), 
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print(data)
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY")
    if not isinstance(secret, (str, bytes)) or not secret:
        secret = "dev-secret-change-me"  
    user_or_email = str(data.get('email'))
    password = str(data.get('password'))
    user = User.query.filter_by(email=user_or_email).first()
    user2 = User.query.filter_by(name = user_or_email).first()
    if not user or not user.check_password(password):
        if not user2 or not user2.check_password(password):
            return jsonify({"error": "Credenciales inválidas"}), 401
        user = user2
    token = jwt.encode(
        {"user_id": user.id, "type": "access",
        "exp": datetime.utcnow() + timedelta(hours=1)},
        secret,
        algorithm="HS256"
    )
    refresh_token = jwt.encode(
        {"user_id": user.id, "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7)},
        secret,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Inicio de sesión correcto",
        "access_token": token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200

@bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if not refresh_token:
        return jsonify({"error": "Token de refresco faltante"}), 401

    try:
        decoded = jwt.decode(refresh_token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        if decoded.get("type") != "refresh":
            return jsonify({"error": "Token no es de tipo refresh"}), 401
        user_id = decoded.get("user_id")

        new_access_token = jwt.encode({
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({"access_token": new_access_token}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El refresh token ha caducado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401
    
def _get_current_user():
    """Obtiene el usuario a partir del Bearer access token."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, ("Falta Authorization Bearer", 401)
    token = auth.split(" ", 1)[1].strip()

    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY")
    if not isinstance(secret, (str, bytes)) or not secret:
        secret = "dev-secret-change-me"

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        if payload.get("type") != "access":
            return None, ("Token inválido (no es access)", 401)
        user = User.query.get(payload.get("user_id"))
        if not user:
            return None, ("Usuario no encontrado", 404)
        return user, None
    except jwt.ExpiredSignatureError:
        return None, ("El token ha caducado", 401)
    except jwt.InvalidTokenError:
        return None, ("Token inválido", 401)

@bp.route('/me', methods=['GET', 'PATCH'])
def me():
    user, err = _get_current_user()
    if err:
        msg, code = err
        return jsonify({"error": msg}), code

    if request.method == 'GET':
        # Devuelve el shape que usa tu front
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            # añade estos campos si existen en tu modelo:
            "avatar_url": getattr(user, "avatar_url", None),
            "bio": getattr(user, "bio", None),
            "ocultar_info": getattr(user, "ocultar_info", True),
            "preferences": getattr(user, "preferences", [])  # si es JSON/array
        }), 200

    # PATCH: actualizar campos permitidos
    data = request.get_json(force=True) or {}

    # Validaciones de unicidad (si cambian name/username)
    new_name = data.get("name")
    if new_name and new_name != user.name:
        if User.query.filter(User.name == new_name, User.id != user.id).first():
            return jsonify({"error": "El nombre ya está en uso"}), 400
        user.name = new_name

    new_username = data.get("username")
    if new_username and new_username != user.username:
        if User.query.filter(User.username == new_username, User.id != user.id).first():
            return jsonify({"error": "El username ya está en uso"}), 400
        user.username = new_username

    # Campos opcionales
    if "avatar_url" in data:
        if hasattr(user, "avatar_url"):
            user.avatar_url = data.get("avatar_url")  # puede ser None
    if "bio" in data and hasattr(user, "bio"):
        user.bio = data.get("bio")
    if "ocultar_info" in data and hasattr(user, "ocultar_info"):
        user.ocultar_info = bool(data.get("ocultar_info"))
    if "preferences" in data and hasattr(user, "preferences"):
        prefs = data.get("preferences") or []
        if not isinstance(prefs, list):
            return jsonify({"error": "preferences debe ser una lista"}), 400
        user.preferences = prefs

    db.session.commit()

    return jsonify({
        "message": "Perfil actualizado",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "avatar_url": getattr(user, "avatar_url", None),
            "bio": getattr(user, "bio", None),
            "ocultar_info": getattr(user, "ocultar_info", True),
            "preferences": getattr(user, "preferences", [])
        }
    }), 200