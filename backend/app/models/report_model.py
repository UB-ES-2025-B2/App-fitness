from .. import db
from datetime import datetime

class Report(db.Model):
    __tablename__ = "report"

    id = db.Column(db.Integer, primary_key=True)
    
    reporting_user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False
    )
    reporting_user = db.relationship(
        "User", backref=db.backref("reports_made", lazy="dynamic"), foreign_keys=[reporting_user_id]
    )

    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    post = db.relationship(
        "Post", backref=db.backref("reports", lazy="dynamic")
    )

    category = db.Column(
        db.String(50), 
        nullable=False,
    )
    
    comment = db.Column(db.Text, nullable=True) 
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    status = db.Column(
        db.String(20), 
        default="Pending"
    )

    __table_args__ = (
        db.UniqueConstraint("post_id", "reporting_user_id", name="uq_single_user_report"),
    )

    def __repr__(self):
        return f"<Report {self.id} on Post {self.post_id} by User {self.reporting_user_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "reporting_user_id": self.reporting_user_id,
            "category": self.category,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
        }