# app/models/__init__.py
from datetime import datetime
from .. import db

# Tabla asociativa follow para seguidores/seguidos
follow = db.Table(
    "follow",
    db.Column("follower_id", db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    db.Column("followed_id", db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    db.Column("created_at", db.DateTime, nullable=False, default=datetime.utcnow),
)

from .user_model import User 
from .post_model import Post 
from .post_like_model import PostLike
from .email_verification import EmailVerification
from .comunity_model import Community
from .event_model import Event
from .repost_model import Repost

__all__ = ["User", "Post", "PostLike", "follow", "EmailVerification"]
