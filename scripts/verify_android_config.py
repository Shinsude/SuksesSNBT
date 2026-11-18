#!/usr/bin/env python3
"""Validate Android TWA metadata without creating or exposing signing material."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []
web = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
twa = json.loads((ROOT / "android" / "twa-manifest.template.json").read_text(encoding="utf-8"))

package_id = twa.get("packageId", "")
if not re.fullmatch(r"[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+", package_id):
    errors.append("Android packageId is not a valid reverse-domain application ID")
if package_id != "id.suksessnbt.app":
    errors.append("Android packageId must remain the owner-confirmed id.suksessnbt.app")
if twa.get("host") != "suksessnbt.vercel.app":
    errors.append("TWA host must match the production Sukses SNBT domain")
if twa.get("webManifestUrl") != "https://suksessnbt.vercel.app/manifest.webmanifest":
    errors.append("TWA webManifestUrl must point to the production web manifest")
if twa.get("startUrl") != web.get("start_url"):
    errors.append("TWA startUrl and PWA start_url must match")
if twa.get("display") not in ("standalone", "fullscreen", "minimal-ui"):
    errors.append("PWA display mode is not suitable for a standalone app")
for icon in web.get("icons", []):
    path = icon.get("src", "").lstrip("/")
    if not path or not (ROOT / path).is_file():
        errors.append("PWA icon is missing: " + str(icon.get("src")))
if twa.get("themeColor", "").lower() != web.get("theme_color", "").lower():
    errors.append("Android TWA themeColor must match the PWA manifest theme_color")
if twa.get("backgroundColor", "").lower() != web.get("background_color", "").lower():
    errors.append("Android TWA backgroundColor must match the PWA manifest background_color")
if twa.get("iconUrl") != "https://suksessnbt.vercel.app/icon-512.png":
    errors.append("TWA launcher icon must use the production 512px icon")
if (ROOT / ".well-known" / "assetlinks.json").exists():
    assetlinks = json.loads((ROOT / ".well-known" / "assetlinks.json").read_text(encoding="utf-8"))
    if not assetlinks or not all(item.get("target", {}).get("package_name") == package_id for item in assetlinks):
        errors.append("Published Digital Asset Links do not match the confirmed package ID")

if errors:
    print("\n".join("ERROR: " + item for item in errors))
    raise SystemExit(1)
print("OK: Android TWA identity, production origin, start URL, and PWA icons are consistent.")
