"""Logging settings."""

# -- importing modules
import datetime
import logging
import shutil
from rich.console import Console
from rich.traceback import install
import friendly_traceback

# -- settings for friendlier tracebacks
friendly_traceback.install(lang="ru")

# -- output settings
console = Console(force_terminal=True, color_system="truecolor", legacy_windows=False,
                  width=shutil.get_terminal_size().columns * 2)


# - log base class
class RichMetaHandler(logging.Handler):
    def emit(self, record):
        time = datetime.datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        level = record.levelname
        msg = record.getMessage()
        file = record.filename
        line = record.lineno

        console.print(
            f"[dim]{time}[/] "
            f"[bold cyan]{level:<7}[/] "
            f"[magenta]{file}:{line}[/] "
            f"{msg}",
            markup=True
        )


# - function for reach output
def rich(msg):
    console.print(msg, markup=True)


handler = RichMetaHandler()
log = logging.getLogger("boombloom_io")
log.setLevel(logging.DEBUG)
log.addHandler(handler)
log.propagate = False
log.rich = rich
