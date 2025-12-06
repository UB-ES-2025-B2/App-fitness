from flask import Blueprint, jsonify, request, abort, current_app
import jwt
from app.utils.auth_utils import token_required

from ..models import User, Post, Repost
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
        except:
            pass

    return jsonify(profile_data)

@bp.route("/<int:user_id>/posts")
def get_user_posts(user_id):

    original_posts = Post.query.filter_by(user_id=user_id).all()
    reposts_by_user = Repost.query.filter_by(user_id=user_id).all()

    all_items = []

    for post in original_posts:
        item_dict = post.to_dict()
        item_dict['type'] = 'original'
        item_dict['sort_date'] = post.created_at
        all_items.append(item_dict)

    for repost in reposts_by_user:
        original_post = repost.original_post
        
        if original_post:
            
            reposting_user_data = {
                'id': repost.user_id,
                'username': repost.user.username,
                'name': repost.user.name if hasattr(repost.user, 'name') else repost.user.username,
            }

            repost_dict = {
                'id': original_post.id,
                'type': 'repost',
                'created_at': repost.created_at.isoformat(),
                'sort_date': repost.created_at,
                
                'reposted_by': reposting_user_data,
                'comment_text': repost.comment_text,
                
                'original_content': original_post.to_dict(),
            }
            all_items.append(repost_dict)

    all_items.sort(key=lambda x: x['sort_date'], reverse=True)
    
    final_payload = [{k: v for k, v in item.items() if k != 'sort_date'} for item in all_items]
    
    return jsonify(final_payload)

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