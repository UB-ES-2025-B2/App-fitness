from datetime import datetime
from app import db


class City(db.Model):
    __tablename__ = "city"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100))
    slug = db.Column(db.String(120), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # city -> activities (1:N)
    activities = db.relationship(
        "Activity",
        back_populates="city",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return f"<City {self.id} {self.name}>"
