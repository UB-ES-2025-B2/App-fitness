from sqlite3 import IntegrityError
from flask import Blueprint, request, jsonify, current_app, g
from sqlalchemy.exc import IntegrityError
from flask_cors import cross_origin
from datetime import datetime, timedelta
import jwt, hashlib
import re
from functools import wraps
import os
import requests
 
from .. import db
from ..models.user_model import User
from ..utils.auth_utils import token_required
from ..models.email_verification import EmailVerification

bp = Blueprint('auth', __name__, url_prefix='/auth')

def _jwt_secret():
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY")
    return secret or "dev-secret-change-me"

def _encode_token(payload, delta):
    payload = dict(payload)
    payload["exp"] = datetime.utcnow() + delta
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")

def _decode_token(token):
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])

def _mk_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def _mk_access(user_id):  
    return _encode_token({"user_id": user_id, "type": "access"}, timedelta(hours=1))

def _mk_refresh(user_id): 
    return _encode_token({"user_id": user_id, "type": "refresh"}, timedelta(days=7))

def _mk_verify(user_id, jti): 
    return _encode_token({"user_id": user_id, "type": "email_verify", "jti": jti}, timedelta(hours=24))

def _send_verification_email(to_email, verify_url):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        current_app.logger.warning("RESEND_API_KEY not set; skipping email send.")
        return
    #change from email to allow for sneding to other emails
    payload = {
        "from": "UB Fitness <noreply@migrateveo.com>",
        "to": [to_email],
        "subject": "Verifica tu correo en UB Fitness",
        "html": f"""
            <p>¡Bienvenido/a!</p>
            <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
            <p><a href="{verify_url}">{verify_url}</a></p>
        """,
    }

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        #added console log to check whats wrong
        if res.status_code >= 400:
            current_app.logger.error("Resend error %s: %s", res.status_code, res.text)
        res.raise_for_status()
        current_app.logger.info("Verification email sent to %s", to_email)
    except Exception as e:
        current_app.logger.exception("Failed to send verification email")

def _user_is_verified(user: User) -> bool:
    ev = EmailVerification.query.filter_by(user_id=user.id).first()
    return bool(ev and ev.verified_at is not None)

def auth_required(fn):
    @wraps(fn)
    def _wrapped(*args, **kwargs):
        if request.method == "OPTIONS":
            return ("", 204)
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Falta Authorization Bearer"}), 401
        token = auth.split(" ", 1)[1].strip()
        try:
            payload = _decode_token(token)
            if payload.get("type") != "access":
                return jsonify({"error": "Token inválido (no es access)"}), 401
            user = User.query.get(payload.get("user_id"))
            if not user:
                return jsonify({"error": "Usuario no encontrado"}), 404
            if not _user_is_verified(user):
                return jsonify({"error": "Correo no verificado"}), 403
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "El token ha caducado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
        return fn(*args, **kwargs)
    return _wrapped

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
    topics = data.get('topics') or []  

    if not username or not name or not email or not password:
        return jsonify({"error": "Faltan campos: username, name, email y password son obligatorios."}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres."}), 400
    if len(name) > 15:
        return jsonify({"error": "El nombre 'name' debe tener como máximo 15 caracteres."}), 400

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

        ev = EmailVerification.query.filter_by(user_id=user.id).first()
        if not ev:
            ev = EmailVerification(user_id=user.id)
            db.session.add(ev)

        jti = f"{user.id}-{datetime.utcnow().timestamp()}"
        ev.token_hash = _mk_hash(jti)
        ev.last_sent_at = datetime.utcnow()

        db.session.commit()

        token = _mk_verify(user.id, jti)
        frontend_base = current_app.config.get("FRONTEND_BASE_URL")
        verify_url = f"{frontend_base.rstrip('/')}/verify-email?token={token}"
        _send_verification_email(user.email, verify_url)

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Usuario o email ya registrados"}), 400

    return jsonify({
    "message": "Usuario creado. Revisa tu correo para confirmar tu email.",
    "needs_verification": True,
    "verification_email_sent_at": ev.last_sent_at.isoformat() + "Z"
}), 201

@bp.route('/verify-email', methods=['GET'])
def verify_email():
    token = (request.args.get('token') or '').strip()
    if not token:
        return jsonify({"error": "Token de verificación faltante"}), 400
    try:
        decoded = _decode_token(token)
        if decoded.get("type") != "email_verify":
            return jsonify({"error": "Token inválido (no es de verificación)"}), 400

        user_id = decoded.get("user_id")
        jti = decoded.get("jti") or ""
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ev = EmailVerification.query.filter_by(user_id=user.id).first()
        if not ev:
            return jsonify({"error": "Estado de verificación no encontrado"}), 400

        if ev.token_hash and ev.token_hash != _mk_hash(jti):
            return jsonify({"error": "Este enlace ya no es válido."}), 400

        if not ev.verified_at:
            ev.verified_at = datetime.utcnow()
            ev.token_hash = None
            db.session.commit()

        access = _mk_access(user.id)
        refresh = _mk_refresh(user.id)
        return jsonify({
            "message": "Correo verificado correctamente",
            "access_token": access,
            "refresh_token": refresh,
            "user": getattr(user, "to_profile_dict", lambda: {
                "id": user.id, "name": user.name, "email": user.email, "username": user.username
            })()
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token de verificación ha caducado"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token de verificación inválido"}), 400

@bp.route('/resend-verification', methods=['POST', 'OPTIONS'])
@cross_origin(  
    origins=[
        "http://localhost:3000",
        "https://app-fitness-1-pr-61.onrender.com",  
        "https://app-fitness-1.onrender.com", 
        "https://app-fitness-3.onrender.com", 
        "https://app-fitness-2.onrender.com", 
    ],
    methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
def resend_verification():
    if request.method == "OPTIONS":
        return ("", 204)
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email requerido"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Si existe una cuenta con ese correo, hemos reenviado la verificación."}), 200

    ev = EmailVerification.query.filter_by(user_id=user.id).first()
    if ev and ev.verified_at:
        return jsonify({"message": "Tu correo ya está verificado."}), 200

    if not ev:
        ev = EmailVerification(user_id=user.id)
        db.session.add(ev)

    jti = f"{user.id}-{datetime.utcnow().timestamp()}"
    ev.token_hash = _mk_hash(jti)
    ev.last_sent_at = datetime.utcnow()
    db.session.commit()

    token = _mk_verify(user.id, jti)
    frontend_base = current_app.config.get("FRONTEND_BASE_URL")
    verify_url = f"{frontend_base.rstrip('/')}/verify-email?token={token}"
    _send_verification_email(user.email, verify_url)

    return jsonify({"message": "Correo de verificación reenviado."}), 200

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
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
    if not _user_is_verified(user):
        return jsonify({
            "error": "Debes verificar tu correo antes de iniciar sesión.",
            "needs_verification": True,
            "email": user.email
        }), 403
    
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

    if not _user_is_verified(user):
            return jsonify({"error": "Correo no verificado"}), 403

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