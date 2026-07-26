"""Default settings."""

# -- importing modules
from pathlib import Path
from secrets import token_hex

# -- flask settings
PORT = 8080  # port
HOST = '0.0.0.0'  # host
SECRET_KEY = token_hex(128)  # secret key

# -- app settings
DEBUG = False  # debug mode
PRINT_CONSTANTS = True  # print settings after init

# -- database settings
SQLALCHEMY_DATABASE_URI = 'sqlite:///bloomboom.db'  # path to the database
TEMPLATE_PATH = Path('templates')  # template folder
SKIP_DB_INIT = False

# -- blueprint settings
BASE_BLUEPRINTS = ['main', 'index']  # blueprints, processed without prefix

# -- privileges settings
PERMISSION_GROUPS = {
    'admin': {
        'VIEW_ADMIN_PANEL': True,
    },
    'flower': {
        'VIEW_ADMIN_PANEL': False,
    }
}

# -- default admin settings
ADMIN_PASSWORD = 'password'
ADMIN_USERNAME = 'admin'
ADMIN_PERMISSION_GROUP = 'admin'

# -- default user settings
DEFAULT_PERMISSION_GROUP = 'flower'
