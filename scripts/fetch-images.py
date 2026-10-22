"""Download a Twemoji SVG (CC BY 4.0) for every `img` emoji used in the course data.

Writes public/img/<codepoints>.svg and src/data/img-manifest.json (emoji -> file name).
Existing files are kept, so the script is cheap to re-run after adding words.
"""
import glob
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "img")
MANIFEST = os.path.join(ROOT, "src", "data", "img-manifest.json")
BASE = "https://raw.githubusercontent.com/jdecked/twemoji/v15.1.0/assets/svg/"

os.makedirs(OUT, exist_ok=True)

emojis = []
seen = set()
for f in sorted(glob.glob(os.path.join(ROOT, "src", "data", "m*.ts"))):
    for m in re.finditer(r'img: "([^"]+)"', open(f, encoding="utf-8").read()):
        e = m.group(1)
        if e not in seen:
            seen.add(e)
            emojis.append(e)

manifest = {}
if os.path.exists(MANIFEST):
    manifest = json.load(open(MANIFEST, encoding="utf-8"))


def candidates(e: str):
    cps = [f"{ord(c):x}" for c in e]
    full = "-".join(cps)
    stripped = "-".join(c for c in cps if c != "fe0f")
    names = [full]
    if stripped != full:
        names.append(stripped)
    return names


def fetch(name: str) -> bytes | None:
    try:
        with urllib.request.urlopen(BASE + name + ".svg", timeout=30) as r:
            return r.read()
    except Exception:
        return None


failed = []
downloaded = 0
for e in emojis:
    if e in manifest and os.path.exists(os.path.join(OUT, manifest[e])):
        continue
    ok = False
    for name in candidates(e):
        path = os.path.join(OUT, name + ".svg")
        if os.path.exists(path):
            manifest[e] = name + ".svg"
            ok = True
            break
        data = fetch(name)
        if data and b"<svg" in data[:300]:
            open(path, "wb").write(data)
            manifest[e] = name + ".svg"
            downloaded += 1
            ok = True
            break
    if not ok:
        failed.append((e, candidates(e)))

json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"emojis: {len(emojis)}, downloaded now: {downloaded}, in manifest: {len(manifest)}")
if failed:
    print("FAILED:")
    for e, names in failed:
        print("  ", e, names)
    sys.exit(1)
