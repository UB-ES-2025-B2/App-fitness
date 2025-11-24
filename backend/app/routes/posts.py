from flask import Blueprint, jsonify, request
from app.models.post_model import Post
from app.models.user_model import User
from app import db
from app.utils.auth_utils import token_required

bp = Blueprint("posts", __name__, url_prefix="/api/posts")


# 🔹 1️⃣ Llistar posts
@bp.get("/")
def list_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


# 🔹 2️⃣ Llistar posts d’un usuari concret
@bp.get("/user/<int:user_id>")
def posts_by_user(user_id):
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


# 🔹 3️⃣ Crear un nou post (💥 aquest és el que faltava)
@bp.post("/")
@token_required
def create_post(current_user):
    """
    Crea una publicació amb text, tema i imatge opcional.
    Deriva el user_id del token (ignora user_id del body si viene).
    """
    data = request.get_json(force=True) or {}

    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Falta el campo 'text'"}), 400

    topic = data.get("topic", "General")
    image_url = data.get("image_url")

    post = Post(
        user_id=current_user.id,
        topic=topic,
        text=text,
        image_url=image_url
    )

    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201


# 🔹 4️⃣ (opcional) Endpoint vell - mantenim per compatibilitat
@bp.route("/posts", methods=["GET"])
def get_posts():
    posts = Post.query.all()
    data = []
    for post in posts:
        user = User.query.get(post.user_id)
        data.append({
            "id": post.id,
            "user": user.name if user else "Unknown",
            "topic": post.topic,
            "text": post.text,
            "image": post.image_url
        })
    return jsonify(data)
