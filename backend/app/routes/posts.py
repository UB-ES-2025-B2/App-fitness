from datetime import timezone
from flask import Blueprint, jsonify, request, g, current_app
import jwt
from app.models.post_model import Post
from app.models.user_model import User
from app import db
from app.utils.auth_utils import token_required

bp = Blueprint("posts", __name__, url_prefix="/api/posts")


# 🔹 1️⃣ Llistar posts
@bp.get("/")
def list_posts():
    """
    Lista todos los posts.
    - Si viene Authorization: Bearer <token>, intenta decodificar y usar user_id
      para calcular likedByMe.
    - Si no viene o es inválido, responde igualmente con 200 y likedByMe=False.
    """
    current_user_id = None

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"],
            )
            current_user_id = payload.get("user_id")
        except Exception as e:
            current_app.logger.debug(f"Invalid token in /api/posts/: {e}")
            # seguimos con current_user_id = None

    posts = Post.query.order_by(Post.created_at.desc()).all()
    payload = [p.to_dict(current_user_id=current_user_id) for p in posts]
    return jsonify(payload)


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


@bp.post("/<int:post_id>/like")
@token_required
def like_post(current_user, post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    if not post.liked_by.filter_by(id=current_user.id).first():
        post.liked_by.append(current_user)
        db.session.commit()
        
    return jsonify({"message": "Liked!", "likes": post.liked_by.count(), "liked": True}), 200


@bp.delete("/<int:post_id>/like")
@token_required
def unlike_post(current_user, post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    if post.liked_by.filter_by(id=current_user.id).first():
        post.liked_by.remove(current_user)
        db.session.commit()
        
    return jsonify({"message": "Unliked", "likes": post.liked_by.count(), "liked": False}), 200


@bp.get("/me/likes")
@token_required
def get_my_liked_posts(current_user):
    liked_posts = current_user.liked_posts.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict(current_user_id=current_user.id) for p in liked_posts]), 200


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
            "image": post.image_url,
            "created_at": post.created_at.replace(tzinfo=timezone.utc).isoformat()
        })
    return jsonify(data)

@bp.delete("/<int:post_id>")
@token_required
def delete_post(current_user, post_id):
    """
    Elimina un post SOLO si pertenece al usuario autenticado.
    """
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post no encontrado"}), 404

    # Asegurarnos de que solo el dueño pueda borrarlo
    if post.user_id != current_user.id:
        return jsonify({"error": "No tienes permiso para eliminar este post"}), 403

    db.session.delete(post)
    db.session.commit()

    return jsonify({"message": "Post eliminado correctamente"}), 200
