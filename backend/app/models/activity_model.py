from datetime import datetime
from app import db


class Activity(db.Model):
    __tablename__ = "activity"

    id = db.Column(db.Integer, primary_key=True)

    city_id = db.Column(
        db.Integer,
        db.ForeignKey("city.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(50)) # run, bike, hike…
    distance_km = db.Column(db.Numeric(6, 2))
    difficulty = db.Column(db.String(20)) # easy / medium / hard
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    city = db.relationship("City", back_populates="activities")

    user_activities = db.relationship(
        "UserActivity",
        back_populates="activity",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return f"<Activity {self.id} {self.name}>"
