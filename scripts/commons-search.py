"""Search Wikimedia Commons for public-domain fairy-tale illustrations and download review thumbnails.

Usage: python commons-search.py <out_dir> "<key>=<query>" ...
Writes <out_dir>/<key>-<n>.jpg thumbnails and <out_dir>/candidates.json with title, license, artist and URLs.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "EzEng-illustration-picker/1.0 (educational desktop app; contact: levkasterwork@gmail.com)"


def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def search(query, limit=16):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": 480,
    })
    pages = data.get("query", {}).get("pages", {})
    out = []
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if not any(k in lic.lower() for k in ("public domain", "cc0", "pd")):
            continue
        out.append({
            "title": p["title"],
            "license": lic,
            "artist": meta.get("Artist", {}).get("value", ""),
            "date": meta.get("DateTimeOriginal", {}).get("value", ""),
            "thumb": info.get("thumburl"),
            "url": info.get("url"),
            "desc_url": info.get("descriptionurl"),
            "width": info.get("width"),
            "height": info.get("height"),
        })
    return out


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        open(path, "wb").write(r.read())


out_dir = sys.argv[1]
os.makedirs(out_dir, exist_ok=True)
result = {}
for arg in sys.argv[2:]:
    key, query = arg.split("=", 1)
    items = search(query)
    result[key] = items
    for i, it in enumerate(items):
        if it["thumb"]:
            try:
                download(it["thumb"], os.path.join(out_dir, f"{key}-{i}.jpg"))
            except Exception as e:  # noqa: BLE001
                it["thumb_error"] = str(e)
    print(f"{key}: {len(items)} public-domain candidates")
json.dump(result, open(os.path.join(out_dir, "candidates.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
