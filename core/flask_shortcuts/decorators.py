"""Decorators for endpoints."""

# -- importing modules
from functools import wraps
from flask import g, abort
import settings

def required_permissions(*permissions):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            if g.user is None:
                abort(401)
            
            perms = settings.PERMISSION_GROUPS[g.flower.permission_group]
            if not all(p in perms and perms[p] for p in permissions):
                abort(403)

            return view_func(*args, **kwargs)
        return wrapper
    return decorator