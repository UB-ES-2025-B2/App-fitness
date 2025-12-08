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
    repost_count = db.Column(db.Integer, default=0)
    liked_by = db.relationship(
        "User",
        secondary="post_like",
        back_populates="liked_posts",
        lazy="dynamic",
    )
    bookmarked_by = db.relationship(
        "User",
        secondary="bookmark",
        back_populates="bookmarked_posts",
        lazy="dynamic",
    )

    def to_dict(self, current_user_id=None):
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
                "avatar_url": self.author.avatar_url,
            },
            "likes": self.liked_by.count(),
            "reposts":self.repost_count,
        "likedByMe": (
            self.liked_by.filter_by(id=current_user_id).count() > 0
            if current_user_id else False
        ),
        "bookmarkedByMe": (
                self.bookmarked_by.filter_by(id=current_user_id).count() > 0
                if current_user_id else False
            ),
        }
    