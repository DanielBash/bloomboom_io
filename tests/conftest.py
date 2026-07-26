"""Common settings context."""

# -- importing modules
import os
import pytest
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import main


# - app
@pytest.fixture()
def app():
    app = main.app
    app.config.update({"TESTING": True, "WTF_CSRF_ENABLED": False})
    yield app


# - client
@pytest.fixture()
def client(app):
    return app.test_client()
