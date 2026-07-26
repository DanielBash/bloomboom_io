"""Initializing database."""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
import settings

db = SQLAlchemy()


class Flower(db.Model, SerializerMixin):
    __tablename__ = "flowers"

    id = db.Column(db.Integer, primary_key=True)

    password = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(20), nullable=False)
    permission_group = db.Column(db.String(50), nullable=False)

    registered_at = db.Column(db.DateTime, server_default=db.func.now())
    last_visit = db.Column(db.DateTime, server_default=db.func.now())

    def get_permission(self, name):
        permissions = settings.PERMISSION_GROUPS.get(self.permission_group)
        if permissions is None:
            return None

        if name not in permissions:
            return None
        else:
            return permissions[name]
