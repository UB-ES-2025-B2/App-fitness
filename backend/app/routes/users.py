from flask import Blueprint, jsonify
from ..models.user_model import User

bp = Blueprint("users", __name__, url_prefix="/api/users")

@bp.route("/")
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


