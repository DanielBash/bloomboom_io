"""Socketio game i/o."""
from pathlib import Path

# -- importing modules
from flask import request
from flask_socketio import emit, disconnect
from flask import current_app as app
import settings
from core.core import login_flower, get_flower, register_flower
from core.models import db

socket_io = app.socket_io

def status_response(response=None):
    status = 'OK'
    if response and isinstance(response, str):
        status = 'ERROR'
    return {'status': status, 'response': response}


@socket_io.on('assets')
def on_connect():
    emit('assets-response', status_response({
        'models': app.game_state['models'],
        'map': app.game_state['map']
    }))