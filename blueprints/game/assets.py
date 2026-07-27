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
app.assets = {
    'models': [],
}
for i in Path('static/models').iterdir():
    app.assets['models'].append(i.stem)

def status_response(response=None):
    status = 'OK'
    if response and isinstance(response, str):
        status = 'ERROR'
    return {'status': status, 'response': response}


@socket_io.on('assets')
def on_connect():
    emit('assets-response', status_response(app.assets))