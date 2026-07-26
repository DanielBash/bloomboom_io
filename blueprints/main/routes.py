"""Main page blueprint."""

# -- importing modules
from flask import url_for, redirect, render_template
from flask import Blueprint

bp = Blueprint('main', __name__)


@bp.route('/', methods=['GET'])
def index():
    return render_template('index.html')
