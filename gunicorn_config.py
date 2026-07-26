"""Gunicorn config."""

bind = "0.0.0.0:8080"
workers = 1
worker_class = "gthread"
threads = 100
timeout = 30
keepalive = 5
spew = False

accesslog = "-"
errorlog = "-"

loglevel = "info"

proc_name = "boombloom_io_gunicorn"