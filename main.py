"""Launch-file for the app."""

# - importing modules
from core.core import create_app
import settings
from core.flask_shortcuts import after_initialization
from core.logger import log

# - initializing app
app = create_app(__name__)
log.info('App created.')

if __name__ == '__main__':
    app.socket_io.run(app=app, host=settings.HOST, port=settings.PORT, use_reloader=False)
