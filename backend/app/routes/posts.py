from flask import Blueprint, jsonify
from app.models.post_model import Post
from app.models.user_model import User
from app import db

posts_bp = Blueprint("posts", __name__)

@posts_bp.route("/posts", methods=["GET"])
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
