"""All jinja filters."""


# - importing modules
import markdown
from markupsafe import Markup


# -- filters
# - markdown filter
def filter_markdown(text):
    html = markdown.markdown(
        text,
        extensions=[
            "fenced_code",
            "codehilite",
            "tables",
            "nl2br",
            "sane_lists"
        ]
    )

    return Markup(html)

# - collecting all filters
jinja_filters = {}

for name in list(globals().keys()):
    if name.startswith("filter_") and callable(globals()[name]):
        jinja_filters[name[7:]] = globals()[name]
