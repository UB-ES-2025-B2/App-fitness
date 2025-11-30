from datetime import datetime
from app import db


class UserActivity(db.Model):
    __tablename__ = "user_activity"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )

    activity_id = db.Column(
        db.Integer,
        db.ForeignKey("activity.id", ondelete="CASCADE"),
        nullable=False,
    )

    done_at = db.Column(db.DateTime, nullable=False)
    duration_sec = db.Column(db.Integer)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    user = db.relationship("User", back_populates="user_activities")
    activity = db.relationship("Activity", back_populates="user_activities")

    def __repr__(self) -> str:
        return f"<UserActivity user={self.user_id} activity={self.activity_id}>"
