from .. import db
from datetime import datetime


event_participants = db.Table(
    "event_participants",
    db.Column("event_id", db.Integer, db.ForeignKey("event.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True)
)

class Event(db.Model):
    __tablename__ = "event"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    image_url = db.Column(db.Text)

    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    location = db.Column(db.String(200), nullable=True)

    community_id = db.Column(db.Integer, db.ForeignKey("community.id"), nullable=False)

    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


    community = db.relationship("Community", backref=db.backref("events", lazy="dynamic"))
    participants = db.relationship(
        "User",
        secondary=event_participants,
        backref=db.backref("events_joined", lazy="dynamic"),
        lazy="dynamic"
    )

    def add_participant(self, user):
        if not self.is_participant(user):
            self.participants.append(user)

    def remove_participant(self, user):
        if self.is_participant(user):
            self.participants.remove(user)

    def is_participant(self, user):
        return self.participants.filter_by(id=user.id).count() > 0

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            "location": self.location,
            "imageUrl": self.image_url,
            "communityId": self.community_id,
            "createdBy": self.created_by,
            "participants": [u.id for u in self.participants],
            "createdAt": self.created_at.isoformat(),
        }
