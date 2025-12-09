from .. import db
from datetime import datetime

class EmailVerification(db.Model):
    __tablename__ = "email_verifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    last_sent_at = db.Column(db.DateTime, nullable=True)
    token_hash = db.Column(db.String(128), nullable=True)

    user = db.relationship("User", backref=db.backref("email_verification", uselist=False))


    def __repr__(self):
        return f"<EmailVerification user_id={self.user_id} verified={self.verified_at is not None}>"
    