"""Socketio game i/o."""

# -- importing modules
from flask import current_app as app
from flask import request
from flask_socketio import emit, disconnect

import settings
from core.core import login_flower, get_flower, register_flower, create_mob
from core.models import db

socket_io = app.socket_io


def status_response(response=None):
    status = 'OK'
    if response and isinstance(response, str):
        status = 'ERROR'
    return {'status': status, 'response': response}


def state_response(sid, include_map=False, include_personal=False):
    response = {
        'world': {
            'mobs': app.game_state['mobs'],
        },
    }
    if include_map:
        response['world']['map'] = app.game_state['map']
    if include_personal:
        flower = get_flower(app.game_state['connections'][sid]['flower'])
        response['flower'] = {
            'account': {
                'username': flower.username,
                'is_online': flower.is_online,
                'is_playing': flower.is_playing,
                'xp': flower.xp,
            },
            'mob': app.game_state['connections'][sid]['mob']
        }
    return status_response(response)


@socket_io.on('connect')
def on_connect():
    emit('connect-response', status_response())


@socket_io.on('login')
def on_login(data):
    sid = request.sid

    if 'username' not in data or 'password' not in data:
        emit('login-response', status_response('Please, specify both username and password.'))
        return

    if sid in app.game_state['connections']:
        emit('login-response', status_response('This connection is already logged in.'))
        return

    username = data['username']
    password = data['password']
    flower_model = login_flower(username, password)
    if not flower_model:
        emit('login-response', status_response('Incorrect username or password.'))
        return
    flower = flower_model.username
    for existing_sid, conn in list(app.game_state['connections'].items()):
        if conn['flower'] == flower and existing_sid != sid:
            disconnect(existing_sid)
            break

    app.game_state['connections'][sid] = {
        'flower': flower,
        'mob': None
    }
    flower_model.is_online = True
    db.session.commit()

    emit('login-response', status_response({'username': data['username']}))
    emit('state', state_response(sid, include_map=True, include_personal=True))
    emit('state', state_response({'scene_name': 'lobby'}))


@socket_io.on('disconnect')
def on_disconnect():
    sid = request.sid
    conn = app.game_state['connections'].pop(sid, None)

    if conn:
        flower = conn['flower']
        if conn['mob']:
            del app.game_state['mobs'][conn['mob']['identity']]
        if flower:
            flower_model = get_flower(flower)
            flower_model.is_online = False
            db.session.commit()
    emit('disconnect-response', status_response())


@socket_io.on('signup')
def on_signup(data):
    if 'username' not in data or 'password' not in data:
        emit('signup-response', status_response('Please, specify both username and password.'))
        return

    if len(data['username']) < 3 or len(data['username']) > 20:
        emit('signup-response',
             status_response('Your username doesnt match length requirements. From 3 to 20 characters.'))
        return
    if len(data['password']) < 5 or len(data['password']) > 20:
        emit('signup-response',
             status_response('Your password doesnt match length requirements. From 5 to 20 characters.'))
        return

    flower = get_flower(username=data['username'])
    if flower:
        emit('signup-response', status_response('Flower with this name already exists.'))
        return

    register_flower(
        username=data['username'],
        password=data['password'],
        permission_group=settings.DEFAULT_PERMISSION_GROUP,
    )
    emit('signup-response', status_response({'username': data['username'], 'password': data['password']}))


@socket_io.on('play')
def on_play():
    sid = request.sid

    if sid not in app.game_state['connections']:
        emit('play-response', status_response('This connection is not logged in.'))
        return

    app.game_state['connections'][sid]['mob'] = create_mob('flower', (0, 0),
                                                           name=app.game_state['connections'][sid]['flower'])
    emit('state', state_response(sid, include_map=False, include_personal=True))
    emit('state', status_response({'scene_name': 'game'}))


@socket_io.on('move')
def on_move(data):
    sid = request.sid

    if sid not in app.game_state['connections']:
        emit('move-response', status_response('This connection is not logged in.'))
        return
    if not app.game_state['connections'][sid]['mob']:
        emit('move-response', status_response('This connection is not assigned to a mob.'))
        return
    if 'x' not in data or 'rotation' not in data or 'y' not in data:
        emit('move-response', status_response('Not enough data specified.'))
        return
    x = data['x']
    y = data['y']
    rotation = data['rotation']
    app.game_state['connections'][sid]['mob']['position']['x'] = x
    app.game_state['connections'][sid]['mob']['position']['y'] = y
    app.game_state['connections'][sid]['mob']['rotation'] = rotation
    emit('move-response', status_response())
