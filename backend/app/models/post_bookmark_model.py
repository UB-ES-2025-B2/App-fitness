from datetime import datetime
from .. import db

class Bookmark(db.Model):
    __tablename__ = "bookmark"

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
