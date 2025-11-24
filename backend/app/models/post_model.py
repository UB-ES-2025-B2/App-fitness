from .. import db
import bcrypt
from datetime import datetime

class Post(db.Model):
    __tablename__ = "post"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    topic = db.Column(db.String(50), nullable=False)
    text = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "topic": self.topic or "",
            "image": self.image_url,
            "date": self.created_at.isoformat() if self.created_at else None,
            "user": {
                "id": self.author.id,
                "username": self.author.username,
                "name": self.author.name,
            },
        }