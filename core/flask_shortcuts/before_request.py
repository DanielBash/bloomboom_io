"""Функции до обработки запроса"""
import datetime

from flask import g, session, current_app
from ..models import Flower, db


@current_app.before_request
def load_logged_in_flower():
    flower_id = session.get("flower_id")

    if flower_id is None:
        g.flower = None
    else:
        g.flower = Flower.query.get(flower_id)
        g.flower.last_visit = datetime.datetime.utcnow()
        db.session.commit()