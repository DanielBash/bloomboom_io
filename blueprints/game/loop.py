"""Game loop."""
import random
import time
from pathlib import Path

# -- importing modules
from flask import current_app as app
from flask_socketio import emit

import settings


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


def loop():
    pass


init_game()
