#!/usr/bin/env python3
"""Static integrity checks for the SuksesSNBT site."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            value = attrs.get(key)
            if value:
                self.targets.append(value)

html_files = sorted(ROOT.rglob("*.html"))
errors = []
parsed = {}
for file in html_files:
    parser = Links()
    parser.feed(file.read_text(encoding="utf-8"))
    parsed[file] = parser
for file, parser in parsed.items():
    for raw in parser.targets:
        value = raw.strip()
        if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
            continue
        parsed_url = urlparse(value)
        if parsed_url.scheme or parsed_url.netloc:
            continue
        path = unquote(parsed_url.path)
        if not path:
            target = file
        elif path.startswith("/"):
            target = ROOT / path.lstrip("/")
        else:
            target = (file.parent / path).resolve()
        if not target.exists():
            errors.append(f"{file.relative_to(ROOT)} -> missing {value}")
        elif parsed_url.fragment and target.suffix == ".html":
            target_parser = parsed.get(target)
            if target_parser and unquote(parsed_url.fragment) not in target_parser.ids:
                errors.append(f"{file.relative_to(ROOT)} -> missing anchor {value}")

manifest = ROOT / "manifest.webmanifest"
try:
    json.loads(manifest.read_text(encoding="utf-8"))
except Exception as exc:
    errors.append(f"manifest.webmanifest is invalid JSON: {exc}")

sw = (ROOT / "service-worker.js").read_text(encoding="utf-8")
match = re.search(r"const CORE_ASSETS\s*=\s*(\[[\s\S]*?\])\s*;", sw)
if not match:
    errors.append("service-worker.js has no readable CORE_ASSETS array")
else:
    try:
        assets = json.loads(match.group(1))
        for asset in assets:
            target = ROOT / asset.lstrip("/")
            if not target.exists():
                errors.append(f"service worker precache target missing: {asset}")
    except Exception as exc:
        errors.append(f"service worker CORE_ASSETS is invalid JSON: {exc}")

home = (ROOT / "index.html").read_text(encoding="utf-8")
if "suksessnbt.apk" in home:
    errors.append("homepage still links to an APK that is not present")
if "500+" in home:
    errors.append("homepage still advertises an unverified 500+ question count")
if not (ROOT / "progres.html").exists():
    errors.append("progress page is missing")
if not (ROOT / "tryout.html").exists():
    errors.append("tryout page is missing")

if errors:
    print("\n".join(f"ERROR: {item}" for item in errors))
    sys.exit(1)
print(f"OK: checked {len(html_files)} HTML pages and {len(assets) if match else 0} PWA precache paths.")
