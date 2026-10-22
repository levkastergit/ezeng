"""Download the chosen public-domain illustrations (from commons-search.py candidates) into public/tales
and write src/data/taleImages.ts with file names and credits.

Usage: python tales-images.py <candidates_dir1> <candidates_dir2> ...
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "tales")
UA = "EzEng-illustration-picker/1.0 (educational desktop app; contact: levkasterwork@gmail.com)"

# (candidate key, index) -> (tale id, page index)
SELECTION = {
    ("pigs2", 7): ("pigs", 0), ("pigs2", 12): ("pigs", 1), ("pigs", 0): ("pigs", 2),
    ("pigs2", 10): ("pigs", 3), ("pigs2", 8): ("pigs", 4), ("pigs2", 11): ("pigs", 5),
    ("goldi3", 0): ("goldilocks", 0), ("goldi2", 3): ("goldilocks", 1), ("goldi2", 4): ("goldilocks", 2),
    ("goldi2", 5): ("goldilocks", 4), ("goldi2", 7): ("goldilocks", 5),
    ("redhood", 5): ("redhood", 0), ("redhood", 6): ("redhood", 1), ("redhood", 11): ("redhood", 2),
    ("redhood", 8): ("redhood", 3), ("redhood", 9): ("redhood", 4), ("redhood", 10): ("redhood", 5),
    ("tort2", 11): ("tortoise", 0), ("tort2", 8): ("tortoise", 1), ("tortoise", 0): ("tortoise", 2),
    ("tort2", 10): ("tortoise", 3), ("tort2", 7): ("tortoise", 4),
    ("lion2", 5): ("lion", 0), ("lion2", 7): ("lion", 1), ("lion2", 8): ("lion", 2),
    ("lion2", 3): ("lion", 3), ("lion2", 4): ("lion", 4),
    ("wolf3", 1): ("wolf", 0), ("wolf2", 2): ("wolf", 1), ("wolf3", 0): ("wolf", 2), ("wolf", 0): ("wolf", 3),
    ("duck2", 2): ("duckling", 0), ("duck2", 12): ("duckling", 1), ("duck2", 7): ("duckling", 2),
    ("duck2", 9): ("duckling", 3), ("duck2", 1): ("duckling", 4),
    ("jack", 0): ("jack", 0), ("jack2", 0): ("jack", 1), ("jack", 2): ("jack", 2),
    ("jack", 4): ("jack", 3), ("jack", 5): ("jack", 4), ("jack", 6): ("jack", 5),
}

candidates = {}
for d in sys.argv[1:]:
    candidates.update(json.load(open(os.path.join(d, "candidates.json"), encoding="utf-8")))

os.makedirs(OUT, exist_ok=True)


def clean_artist(a: str) -> str:
    a = re.sub(r"<[^>]+>", "", a or "").strip()
    a = re.sub(r"\s+", " ", a)
    if not a or "unknown" in a.lower():
        return "автор неизвестен"
    return a[:60]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


result: dict[str, dict[int, dict[str, str]]] = {}
for (key, idx), (tale, page) in SELECTION.items():
    it = candidates[key][idx]
    thumb = it["thumb"]
    big = thumb.replace("/480px-", "/900px-")
    ext = ".png" if big.lower().endswith(".png") else ".jpg"
    fname = f"{tale}-{page}{ext}"
    path = os.path.join(OUT, fname)
    if not os.path.exists(path):
        try:
            data = fetch(big)
        except Exception:
            data = fetch(thumb)
        open(path, "wb").write(data)
    credit = f"{clean_artist(it.get('artist'))} · {it.get('license') or 'public domain'} · Wikimedia Commons"
    result.setdefault(tale, {})[page] = {"file": fname, "credit": credit, "source": it.get("desc_url", "")}
    print(f"{tale} p{page}: {fname} ({os.path.getsize(path) // 1024} KB) — {credit}")

lines = ["/** Public-domain illustrations for the tales (downloaded by scripts/tales-images.py). */",
         "export interface TaleImage {", "  file: string;", "  credit: string;", "  source: string;", "}", "",
         "export const taleImages: Record<string, Record<number, TaleImage>> = " + json.dumps(result, ensure_ascii=False, indent=2) + ";", ""]
open(os.path.join(ROOT, "src", "data", "taleImages.ts"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("written taleImages.ts with", sum(len(v) for v in result.values()), "images")
