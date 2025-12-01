# app/routes/activity.py
from datetime import datetime
from flask import Blueprint, jsonify

from .. import db
from ..models import Activity, UserActivity
from ..utils.auth_utils import token_required

bp = Blueprint("activity", __name__, url_prefix="/api/activities")


@bp.post("/<int:activity_id>/complete")
@token_required
def complete_activity(current_user, activity_id):
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"error": "Actividad no encontrada"}), 404

    new_record = UserActivity(
        user_id=current_user.id,
        activity_id=activity_id,
        done_at=datetime.utcnow(),
        duration_sec=None,
        notes=None,
    )
    db.session.add(new_record)
    db.session.commit()

    return jsonify({
        "message": "Actividad completada",
        "activity_id": activity_id,
    }), 201
