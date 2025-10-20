from flask import Blueprint, jsonify
from app.models.post_model import Post
from app.models.user_model import User
from app import db

bp = Blueprint("posts", __name__, url_prefix="/api/posts")

@bp.route("/posts", methods=["GET"])
def get_posts():
    posts = Post.query.all()
    data = []
    for post in posts:
        user = User.query.get(post.user_id)
        data.append({
            "id": post.id,
            "user": user.name if user else "Unknown",  # aquí devuelves string como en tu TS
            "topic": post.topic,
            "text": post.text,
            "image": post.image_url
        })
    return jsonify(data)

@bp.get("/")
def list_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])

@bp.get("/user/<int:user_id>")
def posts_by_user(user_id):
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])
