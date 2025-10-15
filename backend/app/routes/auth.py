from flask import Blueprint, request, jsonify, current_app
from ..models.user_model import User
from .. import db
import jwt
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "Faltan campos"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El correo ya está registrado"}), 400
    if User.query.filter_by(name=name).first():
        return jsonify({"error": "El nombre de usuario ya está registrado"}), 400

    user = User(name=name, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Usuario creado correctamente"}), 201


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_or_email = data.get('user')
    password = data.get('password')
    user = User.query.filter_by(email=user_or_email).first()
    user2 = User.query.filter_by(name = user_or_email).first()
    if not user or not user.check_password(password):
        if not user2 or not user2.check_password(password):
            return jsonify({"error": "Credenciales inválidas"}), 401
        user = user2

    token = jwt.encode({
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(hours=1) 
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Inicio de sesión correcto",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200