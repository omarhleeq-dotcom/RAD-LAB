"""Baseline-compatible page weights: gzip level 9, mtime 0; HTML-linked JS+CSS only."""
import gzip
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get("src") if tag == "script" else attrs.get("href") if tag == "link" else None
        if value:
            url = urlsplit(value)
            if not url.scheme and not url.netloc and url.path.endswith((".js", ".css")):
                self.paths.add(unquote(url.path))


root = Path("out").resolve()
rows = []
for html in sorted(root.rglob("*.html")):
    assets = Assets()
    assets.feed(html.read_text())
    paths = {(root / p.lstrip("/") if p.startswith("/") else html.parent / p).resolve() for p in assets.paths}
    if any(not p.is_relative_to(root) for p in paths):
        raise ValueError("asset outside export")
    rows.append({"page": html.relative_to(root).as_posix(),
                 "gzip_bytes": sum(len(gzip.compress(p.read_bytes(), compresslevel=9, mtime=0)) for p in paths),
                 "assets": len(paths)})
if not rows:
    raise ValueError("missing static export; run build:pages first")
print(json.dumps(rows))
