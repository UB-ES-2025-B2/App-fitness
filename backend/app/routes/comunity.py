from flask import Blueprint, jsonify
from ..models import Community, User
from app.models import db
from flask import request

bp = Blueprint("communities", __name__, url_prefix="/api/communities")


@bp.route("/", methods=["GET"])
def get_communities():
    """Devuelve todas las comunidades"""
    communities = Community.query.order_by(Community.created_at.desc()).all()
    return jsonify([c.to_dict() for c in communities])


@bp.route("/<int:community_id>", methods=["GET"])
def get_community(community_id):
    """Devuelve una comunidad concreta por ID"""
    community = Community.query.get_or_404(community_id)
    return jsonify(community.to_dict())


@bp.route("/", methods=["POST"])
def create_community():
    """Crea una nueva comunidad"""
    data = request.get_json(force=True) or {}

    # Campos obligatorios
    name = data.get("name")
    created_by_id = data.get("created_by")
    reglas = data.get("reglas", "")

    if not name or not created_by_id:
        return jsonify({"error": "Faltan campos obligatorios: 'name' y 'created_by'"}), 400

    # Comprueba que el usuario creador existe
    creator = User.query.get(created_by_id)
    if not creator:
        return jsonify({"error": "Usuario creador no encontrado"}), 404

    # Campos opcionales
    description = data.get("description", "")
    private = bool(data.get("private", False))
    image_url = data.get("image_url")

    # Crear la comunidad
    community = Community(
        name=name,
        description=description,
        created_by=created_by_id,
        private=private,
        image_url=image_url,
        reglas = reglas
    )



    db.session.add(community)
    db.session.flush()
    community.add_member(creator)
    community.add_admin(creator)
    db.session.commit()

    return jsonify(community.to_dict()), 201

@bp.route("/<int:community_id>/join", methods=["POST"])
def join_community(community_id):
    """Permite que un usuario se una a una comunidad."""
    data = request.get_json(force=True) or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Falta el campo obligatorio 'user_id'"}), 400

    # Buscar comunidad y usuario
    community = Community.query.get(community_id)
    if not community:
        return jsonify({"error": "Comunidad no encontrada"}), 404

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Verificar si ya es miembro
    if community.is_member(user):
        return jsonify({"message": "El usuario ya es miembro de esta comunidad."}), 200

    # Añadir usuario a la comunidad
    try:
        community.add_member(user)
        db.session.commit()
        return jsonify({
            "message": f"Usuario {user.username} se unió a la comunidad {community.name}",
            "community": community.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print("❌ Error al unirse a la comunidad:", e)
        return jsonify({"error": "No se pudo unir a la comunidad"}), 500
