from functools import wraps
from flask import request, jsonify, current_app, g
import jwt
from ..models.user_model import User
from app.models.email_verification import EmailVerification


def _jwt_secret():
    """Use the same secret logic as /auth/login and /auth/_jwt_secret()."""
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY")
    if not isinstance(secret, (str, bytes)) or not secret:
        secret = "dev-secret-change-me"
    return secret


def _user_is_verified(user: User) -> bool:
    ev = EmailVerification.query.filter_by(user_id=user.id).first()
    return bool(ev and ev.verified_at is not None)

def token_required(fn):
    @wraps(fn)
    def _wrapped(*args, **kwargs):
        # Handle preflight nicely
        if request.method == "OPTIONS":
            return ("", 204)

        auth = request.headers.get("Authorization", "")
        print("DEBUG Authorization header:", auth)
        if not auth.startswith("Bearer "):
            print("DEBUG: Missing or malformed Bearer header")
            return jsonify({"error": "Falta Authorization Bearer"}), 401

        token = auth.split(" ", 1)[1].strip()
        print("DEBUG raw token:", token)

        try:
            payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
            print("DEBUG decoded payload:", payload)
            # Must be an access token
            if payload.get("type") != "access":
                return jsonify({"error": "Token inválido (no es access)"}), 401

            user = User.query.get(payload.get("user_id"))
            if not user:
                return jsonify({"error": "Usuario no encontrado"}), 404

            if not _user_is_verified(user):
                return jsonify({"error": "Correo no verificado"}), 403

            # Save on g if you want
            g.current_user = user

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "El token ha caducado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        # 👇 pass the user as first argument, like you were using before
        return fn(user, *args, **kwargs)

    return _wrapped