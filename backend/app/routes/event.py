from flask import Blueprint, jsonify, request
from app.models import db, Event, Community, User
from datetime import datetime

bp = Blueprint("events", __name__, url_prefix="/api/events")


@bp.route("/", methods=["POST"])
def create_event():
    """Crea un nuevo evento en una comunidad"""
    data = request.get_json(force=True)
    title = data.get("title")
    description = data.get("description", "")
    community_id = data.get("community_id")
    created_by = data.get("created_by")
    image_url = data.get("image_url")
    location = data.get("location")

    start_str = data.get("start_date")
    end_str = data.get("end_date")

    if not title or not community_id or not created_by:
        return jsonify({"error": "Faltan campos obligatorios: 'title', 'community_id' y 'created_by'"}), 400

    community = Community.query.get(community_id)
    if not community:
        return jsonify({"error": "Comunidad no encontrada"}), 404

    user = User.query.get(created_by)
    if not user:
        return jsonify({"error": "Usuario creador no encontrado"}), 404

    try:
        start_date = datetime.fromisoformat(start_str) if start_str else datetime.utcnow()
        end_date = datetime.fromisoformat(end_str) if end_str else start_date
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido (usa ISO 8601)"}), 400

    event = Event(
        title=title,
        description=description,
        community_id=community_id,
        created_by=created_by,
        start_date=start_date,
        end_date=end_date,
        location=location,
        image_url=image_url
    )

    db.session.add(event)
    db.session.commit()

    return jsonify(event.to_dict()), 201


@bp.route("/community/<int:community_id>", methods=["GET"])
def get_events_by_community(community_id):
    """Devuelve todos los eventos de una comunidad"""
    events = Event.query.filter_by(community_id=community_id).order_by(Event.start_date.asc()).all()
    return jsonify([e.to_dict() for e in events])


@bp.route("/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    """Edita un evento existente"""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Evento no encontrado"}), 404

    data = request.get_json(force=True)
    event.title = data.get("title", event.title)
    event.description = data.get("description", event.description)
    event.image_url = data.get("image_url", event.image_url)
    event.location = data.get("location", event.location)

    start_str = data.get("start_date")
    end_str = data.get("end_date")

    try:
        if start_str:
            event.start_date = datetime.fromisoformat(start_str)
        if end_str:
            event.end_date = datetime.fromisoformat(end_str)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

    db.session.commit()
    return jsonify(event.to_dict()), 200


@bp.route("/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    """Elimina un evento"""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Evento no encontrado"}), 404

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": f"Evento '{event.title}' eliminado correctamente"}), 200


@bp.route("/<int:event_id>/join", methods=["POST"])
def join_event(event_id):
    """Permite que un usuario se apunte a un evento"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Falta el campo obligatorio 'user_id'"}), 400

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Evento no encontrado"}), 404

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if event.is_participant(user):
        return jsonify({"message": "El usuario ya está apuntado a este evento"}), 200

    event.add_participant(user)
    db.session.commit()

    return jsonify({
        "message": f"Usuario {user.username} se apuntó al evento {event.title}",
        "event": event.to_dict()
    }), 200


@bp.route("/<int:event_id>/leave", methods=["POST"])
def leave_event(event_id):
    """Permite que un usuario se desapunte de un evento"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Falta el campo obligatorio 'user_id'"}), 400

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Evento no encontrado"}), 404

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not event.is_participant(user):
        return jsonify({"message": "El usuario no está apuntado a este evento"}), 200

    event.remove_participant(user)
    db.session.commit()

    return jsonify({
        "message": f"Usuario {user.username} se desapuntó del evento {event.title}",
        "event": event.to_dict()
    }), 200


@bp.route("/<int:event_id>/is_joined/<int:user_id>", methods=["GET"])
def is_user_joined(event_id, user_id):
    """Comprova si un usuari està apuntat a un esdeveniment"""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Evento no encontrado"}), 404

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    is_joined = event.is_participant(user)

    return jsonify({
        "event_id": event_id,
        "user_id": user_id,
        "is_joined": is_joined
    }), 200
