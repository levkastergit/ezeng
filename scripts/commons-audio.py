"""Search Wikimedia Commons for freely licensed song recordings (vocal performances).

Usage: python commons-audio.py <out.json> "<key>=<query>" ...
Writes a JSON list of candidates with title, license, artist, size, mime and URLs (no downloads).
"""
import json
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "EzEng-song-picker/1.0 (educational desktop app; contact: levkasterwork@gmail.com)"
AUDIO = ("audio/ogg", "audio/mpeg", "audio/x-flac", "audio/flac", "audio/wav", "audio/x-wav", "audio/webm", "application/ogg")
OK_LICENSES = ("public domain", "cc0", "pd", "cc by", "cc-by", "attribution")


def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def search(query, limit=30):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": query + " filetype:audio",
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
    })
    pages = data.get("query", {}).get("pages", {})
    out = []
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        mime = info.get("mime", "")
        if mime not in AUDIO:
            continue
        if not any(k in lic.lower() for k in OK_LICENSES):
            continue
        desc = meta.get("ImageDescription", {}).get("value", "")
        out.append({
            "title": p["title"],
            "license": lic,
            "artist": meta.get("Artist", {}).get("value", "")[:200],
            "credit": meta.get("Credit", {}).get("value", "")[:200],
            "date": meta.get("DateTimeOriginal", {}).get("value", "")[:40],
            "desc": desc[:300],
            "size": info.get("size"),
            "mime": mime,
            "url": info.get("url"),
            "desc_url": info.get("descriptionurl"),
        })
    return out


def main():
    out_path = sys.argv[1]
    result = {}
    for arg in sys.argv[2:]:
        key, query = arg.split("=", 1)
        try:
            result[key] = search(query)
        except Exception as e:  # noqa: BLE001
            result[key] = {"error": str(e)}
        print(key, "->", len(result[key]) if isinstance(result[key], list) else result[key], flush=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
