"""Game loop."""

# -- importing modules
from flask import current_app as app
from pathlib import Path
import random

def init_game():
    app.game_state = {
        'mobs': [],
        'map': [],
        'connections': {},
        'models': [],
    }
    for i in Path('static/models').iterdir():
        app.game_state['models'].append(i.stem)

    for row in range(23):
        row = []
        for column in range(23):
            if random.randint(1, 50) == 1:
                row.append(f'tree_0')
            else:
                row.append(f'ground_{random.randint(0, 3)}')
        app.game_state['map'].append(row)
init_game()