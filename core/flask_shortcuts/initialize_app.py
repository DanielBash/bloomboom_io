"""Initializing flask app."""

from flask import Flask
from flask_socketio import SocketIO

import settings
from . import after_initialization
from . import jinja_filters
from ..logger import log
from ..models import db


# - initializing app
def create_app(name):
    app = Flask(name)
    socket_io = SocketIO(async_mode="threading",
                         cors_allowed_origins="*")

    app.config.from_object(settings.FLASK_SETTINGS)

    db.init_app(app)
    socket_io.init_app(app)
    app.socket_io = socket_io

    log.info('Initializing blueprints.')
    with app.app_context():
        from blueprints import blueprints

        for bp in blueprints:
            if bp not in settings.BASE_BLUEPRINTS:
                app.register_blueprint(blueprints[bp], url_prefix=f'/{bp}')
            else:
                app.register_blueprint(blueprints[bp])

        if not settings.SKIP_DB_INIT:
            db.create_all()
            after_initialization.main()

    for key, val in jinja_filters.jinja_filters.items():
        app.jinja_env.filters[key] = val

    with app.app_context():
        pass

    return app
