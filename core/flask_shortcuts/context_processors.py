"""Creating context processors."""

# -- importing modules
from flask import current_app, g


@current_app.context_processor
def inject_user():
    return dict(flower=g.flower)