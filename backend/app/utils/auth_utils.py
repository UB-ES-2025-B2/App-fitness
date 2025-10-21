from functools import wraps
from flask import request, jsonify, current_app
import jwt
from ..models.user_model import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "") or ""
        # Acepta "Bearer <token>" o el token directo
        token = auth.split(" ", 1)[1] if auth.startswith("Bearer ") else auth
        if not token:
            return jsonify({"error": "Token faltante"}), 401
        try:
            data = jwt.decode(token, current_app.config.get("JWT_SECRET_KEY") or current_app.config['SECRET_KEY'],
                              algorithms=["HS256"])
            user_id = data["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return f(user, *args, **kwargs)
    return decorated