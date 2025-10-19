from .. import db
import bcrypt
from datetime import datetime
from sqlalchemy.dialects.sqlite import JSON
from . import follow

class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, index=True, nullable=False)

    name = db.Column(db.String(15), nullable=False)
    avatar_url = db.Column(db.Text)
    bio = db.Column(db.String(200))

    email = db.Column(db.String(255), unique=True, nullable=False)

    password_hash = db.Column(db.String(60), nullable=False)  # bcrypt hash

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    preferences = db.Column(JSON, default=list)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    posts = db.relationship("Post", backref="author", lazy="dynamic", cascade="all, delete-orphan")

    ocultar_info = db.Column(db.Boolean, nullable=False, server_default="1")

    followers = db.relationship(
        "User",
        secondary=follow,
        primaryjoin=(follow.c.followed_id == id), # usuarios que me siguen
        secondaryjoin=(follow.c.follower_id == id), # usuarios a los que sigo
        lazy="dynamic",
        backref=db.backref("following", lazy="dynamic"),
    )

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    # Serializador para el perfil
    def to_profile_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name or "",
            "avatarUrl": self.avatar_url,
            "bio": self.bio or "",
            "ocultarInfo": bool(self.ocultar_info),
            "createdAt": self.created_at.isoformat(),
        }