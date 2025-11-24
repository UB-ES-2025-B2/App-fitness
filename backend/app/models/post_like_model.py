from datetime import datetime
from app import db  
from . import follow

class PostLike(db.Model):
    __tablename__ = "post_like"

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)