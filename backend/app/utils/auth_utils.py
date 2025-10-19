from functools import wraps
from flask import request, jsonify, current_app
import jwt
from ..models.user_model import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token faltante"}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user_id = data["user_id"]
        except:
            return jsonify({"error": "Token inválido o expirado"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Usuari no trobat"}), 404
        return f(user, *args, **kwargs)
    return decorated