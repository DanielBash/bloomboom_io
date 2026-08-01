"""Game loop."""

# -- importing modules

import time
import settings
from core.core import game_tick
from .auth import status_response


def game_loop(app):
    socket_io = app.socket_io

    tick_time = 1 / settings.TPS

    while True:
        start = time.perf_counter()

        game_tick(app)

        socket_io.emit(
            "state",
            status_response({
                'world': {
                    'mobs': app.game_state['mobs'],
                }
            }),
        )
        elapsed = time.perf_counter() - start
        socket_io.sleep(max(0, tick_time - elapsed))
