from flask import Blueprint, jsonify, request, g, current_app
import jwt
from app.models import Repost, User, Post
from app import db
from app.utils.auth_utils import token_required
from sqlalchemy.exc import IntegrityError

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

    original_items = Post.query.all()
    
    # 2. Carregar Reposts
    repost_items = Repost.query.all()

    all_items = []


    for post in original_items:
        item_dict = post.to_dict(current_user_id=current_user_id)
        item_dict['type'] = 'original'
        item_dict['sort_date'] = post.created_at
        all_items.append(item_dict)

    for repost in repost_items:
        original_post = repost.original_post
        if original_post:
            item_dict = repost.to_dict()
            
            item_dict['original_content'] = original_post.to_dict(current_user_id=current_user_id)
            item_dict['type'] = 'repost'
            item_dict['sort_date'] = repost.created_at
            all_items.append(item_dict)

    all_items.sort(key=lambda x: x['sort_date'], reverse=True)
    final_payload = [{k: v for k, v in item.items() if k != 'sort_date'} for item in all_items]
    
    return jsonify(final_payload)


# 🔹 2️⃣ Llistar posts d’un usuari concret
@bp.get("/user/<int:user_id>")
def posts_by_user(user_id):

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
            item_dict = repost.to_dict()
            item_dict['original_content'] = original_post.to_dict()
            item_dict['type'] = 'repost'
            item_dict['sort_date'] = repost.created_at
            all_items.append(item_dict)

    all_items.sort(key=lambda x: x['sort_date'], reverse=True)
    
    final_payload = [{k: v for k, v in item.items() if k != 'sort_date'} for item in all_items]
    
    return jsonify(final_payload)

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


@bp.post("/<int:post_id>/repost")
@token_required
def repost_post(current_user, post_id):
    original_post = Post.query.get(post_id)
    if not original_post:
        return jsonify({"error": "Post original no trobat"}), 404

    if original_post.user_id == current_user.id:
        return jsonify({"error": "No pots fer Repost del teu propi post"}), 400

    data = request.get_json(silent=True) or {}
    comment_text = data.get("comment_text", "").strip() or None
    
    existing_repost = Repost.query.filter_by(
        user_id=current_user.id,
        original_post_id=post_id
    ).first()
    
    if existing_repost:
        return jsonify({"message": "Aquest post ja ha estat reposteat per tu", "reposted": True}), 200

    try:
        new_repost = Repost(
            user_id=current_user.id,
            original_post_id=post_id,
            comment_text=comment_text
        )
        db.session.add(new_repost)
        
        original_post.repost_count = (original_post.repost_count or 0) + 1
        
        db.session.commit()
        
        
        return jsonify({"message": "Repost creat amb èxit!", "repost_id": new_repost.id}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Error de base de dades. Ja has reposteat aquest post?"}), 500


@bp.delete("/<int:post_id>/repost")
@token_required
def delete_repost(current_user, post_id):
    """
    Elimina el Repost d'un post si existeix.
    """
    original_post = Post.query.get(post_id)
    if not original_post:
        return jsonify({"error": "Post original no trobat"}), 404

    repost_to_delete = Repost.query.filter_by(
        user_id=current_user.id,
        original_post_id=post_id
    ).first()

    if not repost_to_delete:
        return jsonify({"message": "No hi ha cap Repost teu per eliminar en aquest post"}), 200

    db.session.delete(repost_to_delete)

    if original_post.repost_count > 0:
        original_post.repost_count -= 1
        
    db.session.commit()
    
    return jsonify({"message": "Repost eliminat amb èxit!"}), 200

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
