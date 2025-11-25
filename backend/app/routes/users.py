from flask import Blueprint, jsonify, request, abort, current_app
import jwt
from app.utils.auth_utils import token_required

from ..models import User, Post
from app.models import db

bp = Blueprint("users", __name__, url_prefix="/api/users")

@bp.route("/")
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@bp.route("/<int:user_id>/preferences", methods=["GET"])
def get_preferences(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"preferences": user.preferences})


@bp.route("/<int:user_id>/preferences", methods=["POST"])
def add_preferences(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.json
    new_prefs = data.get("preferences", [])

    if not isinstance(new_prefs, list):
        return jsonify({"error": "Las preferencias deben ser una lista"}), 400

    # Evita duplicados
    current = set(user.preferences or [])
    current.update(new_prefs)
    user.preferences = list(current)

    db.session.commit()
    return jsonify(user.to_dict()), 200

@bp.get("/<int:user_id>")
def get_profile(user_id):
    user = User.query.get_or_404(user_id)
    profile_data = user.to_profile_dict()

    # Check if current user is following
    auth_header = request.headers.get("Authorization")
    if auth_header and "Bearer " in auth_header:
        try:
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, current_app.config.get("JWT_SECRET_KEY") or current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data["user_id"]
            current_user = User.query.get(current_user_id)
            if current_user:
                is_following = current_user.following.filter_by(id=user_id).first() is not None
                profile_data["is_following"] = is_following
        except (jwt.DecodeError, jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
            # Token is invalid, expired, or missing required claims - profile still accessible without follow status
            pass

    return jsonify(profile_data)

@bp.route("/<int:user_id>/posts")
def get_user_posts(user_id):
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
    return jsonify([
        {
            "id": p.id,
            "text": p.text,
            "topic": p.topic,
            "image": p.image_url,
            "date": p.created_at.isoformat(),
        } for p in posts
    ])

@bp.put("/<int:user_id>")
def update_profile(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(force=True) or {}
    # Campos editables desde tu UI
    for f in ("name", "avatar_url", "bio", "ocultar_info"):
        if f in data:
            setattr(user, f, data[f])
    db.session.commit()
    return jsonify(user.to_profile_dict())

@bp.get("/<int:user_id>/followers")
def followers(user_id):
    user = User.query.get_or_404(user_id)
    items = [{"id": u.id, "username": u.username, "name": u.name, "avatarUrl": u.avatar_url} for u in user.followers]
    return jsonify(items)

@bp.get("/<int:user_id>/following")
def following(user_id):
    user = User.query.get_or_404(user_id)
    items = [{"id": u.id, "username": u.username, "name": u.name, "avatarUrl": u.avatar_url} for u in user.following]
    return jsonify(items)

@bp.post("/<int:user_id>/follow")
@token_required
def follow_user(current_user, user_id):
    target = User.query.get_or_404(user_id)
    if current_user.id == target.id:
        return jsonify({"error": "No puedes seguirte a ti mismo."}), 400
    
    if not current_user.following.filter_by(id=target.id).first():
        current_user.following.append(target)
        db.session.commit()
    return jsonify({"ok": True, "is_following": True})

@bp.delete("/<int:user_id>/follow")
@token_required
def unfollow_user(current_user, user_id):
    target = User.query.get_or_404(user_id)
    
    if current_user.following.filter_by(id=target.id).first():
        current_user.following.remove(target)
        db.session.commit()
    return jsonify({"ok": True, "is_following": False})