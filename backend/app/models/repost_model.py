from .. import db
from datetime import datetime

class Repost(db.Model):
    __tablename__ = "repost"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    original_post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    comment_text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    original_post = db.relationship("Post", backref=db.backref("reposts", lazy="dynamic"))
    user = db.relationship("User", backref=db.backref("reposted_posts", lazy="dynamic"))
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'original_post_id', name='_user_post_uc'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "original_post_id": self.original_post_id,
            "comment_text": self.comment_text or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reposted_by": {
                "id": self.user.id,
                "username": self.user.username,
            },
        }