"""The core of the website."""

import settings
from core.logger import log
from .models import Flower, db


def create_app(name):
    from .flask_shortcuts import initialize_app
    return initialize_app.create_app(name)


def create_admin_flower():
    register_flower(
        username=settings.ADMIN_USERNAME,
        password=settings.ADMIN_PASSWORD,
        permission_group=settings.ADMIN_PERMISSION_GROUP
    )


def register_flower(username='flower', password=None, permission_group=settings.DEFAULT_PERMISSION_GROUP):
    does_username_exist = Flower.query.filter_by(username=username).count()

    if does_username_exist > 0:
        return

    flower = Flower(
        username=username,
        password=password,
        permission_group=permission_group,
    )

    db.session.add(flower)
    db.session.commit()

    log.info(f'Flower registered: {username}')

    return flower
