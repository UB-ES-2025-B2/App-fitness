from .. import db
from datetime import datetime

community_members = db.Table(
    "community_members",
    db.Column("community_id", db.Integer, db.ForeignKey("community.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True)
)

community_admins = db.Table(
    "community_admins",
    db.Column("community_id", db.Integer, db.ForeignKey("community.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True)
)

class Community(db.Model):
    __tablename__ = "community"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(300))
    reglas = db.Column(db.String(300))
    topic = db.Column(db.String(20))

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    private = db.Column(db.Boolean, nullable=False, default=False)
    image_url = db.Column(db.Text)

    # Relaciones
    members = db.relationship(
        "User",
        secondary=community_members,
        backref=db.backref("communities", lazy="dynamic"),
        lazy="dynamic"
    )

    admins = db.relationship(
        "User",
        secondary=community_admins,
        backref=db.backref("admin_communities", lazy="dynamic"),
        lazy="dynamic"
    )

    def add_member(self, user):
        """Añadir un usuario como miembro."""
        if not self.is_member(user):
            self.members.append(user)

    def remove_member(self, user):
        """Eliminar un usuario como miembro."""
        if self.is_member(user):
            self.members.remove(user)

    def add_admin(self, user):
        """Añadir un usuario como admin (y miembro si no lo es)."""
        if not self.is_admin(user):
            self.admins.append(user)
        if not self.is_member(user):
            self.members.append(user)

    def remove_admin(self, user):
        """Quitar permisos de admin a un usuario."""
        if self.is_admin(user):
            self.admins.remove(user)

    def is_member(self, user):
        return self.members.filter_by(id=user.id).count() > 0

    def is_admin(self, user):
        return self.admins.filter_by(id=user.id).count() > 0

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "topic": self.topic or "",
            "createdAt": self.created_at.isoformat(),
            "private": bool(self.private),
            "imageUrl": self.image_url,
            "members": self.members.count(),
        }
