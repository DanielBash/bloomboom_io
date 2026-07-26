"""Socketio game i/o."""

# -- importing modules
from flask import render_template, request, session, redirect, url_for
from flask import Blueprint
from flask import current_app as app
from flask_socketio import emit

bp = Blueprint('game', __name__)
socket_io = app.socket_io

connected_users = {}

@socket_io.on('connect')
def handle_game_connect():
    emit('server_message', {
        'data': f'Welcome to the game motherfucker!'
    }, broadcast=True)