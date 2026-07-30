"""The core of the website."""
import datetime
import random
import secrets
from pathlib import Path

import settings
from core.logger import log
from werkzeug.security import generate_password_hash, check_password_hash
from .models import Flower, db
from flask import current_app as app

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

    if password is None:
        log.error(f'Cannot register flower without a password: {username}')
        return

    hashed_password = generate_password_hash(password)

    flower = Flower(
        username=username,
        password=hashed_password,
        permission_group=permission_group,
    )

    db.session.add(flower)
    db.session.commit()

    log.info(f'Flower registered: {username}.')

    return flower

def login_flower(username, password):
    flower = Flower.query.filter_by(username=username).first()

    if flower and check_password_hash(flower.password, password):
        flower.last_visit = datetime.datetime.now()
        db.session.commit()
        return flower
    return None

def get_flower(username):
    flower = Flower.query.filter_by(username=username).first()
    return flower

def init_game():
    app.game_state = {
        'mobs': {},
        'map': [],
        'connections': {},
        'models': [],
    }
    for i in Path('static/models').iterdir():
        app.game_state['models'].append(i.stem)

    for row in range(200):
        row = []
        for column in range(200):
            if random.randint(1, 50) == 1:
                if random.randint(0, 1) == 1:
                    row.append(f'tree_0')
                else:
                    row.append(f'water')
            else:
                row.append(f'ground_{random.randint(0, 3)}')
        app.game_state['map'].append(row)


def create_mob(type, position=(0, 0), name='mob'):
    identity = secrets.token_urlsafe(16)
    app.game_state['mobs'][identity] = {
        'type': type,
        'position': {'x': position[0], 'y': position[1]},
        'identity': identity,
        'name': name
    }
    return app.game_state['mobs'][identity]

def game_tick():
    pass