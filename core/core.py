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
from . import mobs

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
    import worlds
    app.game_state = {
        'mobs': {},
        'map': [],
        'connections': {},
        'models': [],
        'delta_time': 1 / settings.TPS
    }
    for i in Path('static/models').iterdir():
        app.game_state['models'].append(i.stem)

    world = settings.WORLD
    world_module = getattr(worlds, world)
    app.game_state['map'] = world_module.MAP
    settings.SOLID_BLOCKS = world_module.SOLID_TILES
    settings.SPAWN_MAP = world_module.SPAWN_MAP
    settings.SPAWN_Y = world_module.SPAWN_Y
    settings.SPAWN_X = world_module.SPAWN_X

def create_mob(**kwargs):
    if 'type' not in kwargs:
        kwargs['type'] = 'mob'
    if 'app' in kwargs:
        _app = kwargs['app']
        del kwargs['app']
        mob = getattr(mobs, kwargs['type'].capitalize(), mobs.Mob).spawn(**kwargs)
        _app.game_state['mobs'][mob['identity']] = mob
        return mob
    else:
        mob = getattr(mobs, kwargs['type'].capitalize(), mobs.Mob).spawn(**kwargs)
        app.game_state['mobs'][mob['identity']] = mob
        return mob

def tick_mobs(app):
    if not hasattr(app, 'mob_instances'):
        app.mob_instances = {}

    current_mobs = app.game_state['mobs']

    for mob_id, mob_data in current_mobs.items():
        if mob_id not in app.mob_instances:
            mob_type = mob_data.get('type', 'default')
            MobClass = getattr(mobs, mob_type.capitalize(), None)
            if MobClass:
                app.mob_instances[mob_id] = MobClass(mob_data, app.game_state)
            else:
                MobClass = getattr(mobs, 'Mob', None)
                app.mob_instances[mob_id] = MobClass(mob_data, app.game_state)
        app.mob_instances[mob_id].update()

    dead_mobs = [mob_id for mob_id in app.mob_instances if mob_id not in current_mobs]
    for mob_id in dead_mobs:
        del app.mob_instances[mob_id]

def tick_deaths(app):
    to_delete = []
    for mob in app.game_state['mobs'].values():
        if mob['health'] <= 0:
            if mob['type'] == 'flower':
                app.socket_io.emit('death', to=mob['connection_sid'])
            to_delete.append(mob['identity'])
    for identity in to_delete:
        del app.game_state['mobs'][identity]

def tick_spawns(app):
    spawn_map = settings.SPAWN_MAP
    rows = len(spawn_map)
    cols = len(spawn_map[0]) if rows > 0 else 0

    if not hasattr(app, 'spawn_timers'):
        app.spawn_timers = [[0.0] * cols for _ in range(rows)]

    for _ in range(settings.ITERATE_THROUGH):
        row = random.randint(0, rows - 1)
        col = random.randint(0, cols - 1)

        tile = spawn_map[row][col]
        if not tile:
            continue

        app.spawn_timers[row][col] += app.game_state['delta_time']

        if app.spawn_timers[row][col] > settings.SERVER_MOB_DELAY and len(app.game_state['mobs'].keys()) < settings.SERVER_MOB_LIMIT:
            app.spawn_timers[row][col] = 0.0

            types = tile
            type_weights = [entry['chance'] for entry in types]
            chosen_type = random.choices(types, weights=type_weights, k=1)[0]

            rarities = chosen_type['rarities']
            rarity_weights = [r['chance'] for r in rarities]
            chosen_rarity = random.choices(rarities, weights=rarity_weights, k=1)[0]

            create_mob(
                position={
                    'x': col + random.random() - 0.5,
                    'y': row + random.random() - 0.5,
                    'height': 0
                },
                type=chosen_type['type'],
                rarity=chosen_rarity['rarity'],
                app=app
            )


def game_tick(app):
    tick_mobs(app)
    tick_deaths(app)
    tick_spawns(app)