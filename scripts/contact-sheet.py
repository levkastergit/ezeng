"""Build labelled contact sheets from commons-search.py output for quick visual review.
Usage: python contact-sheet.py <dir1> [<dir2> ...] --out <prefix>
"""
import json
import os
import re
import sys

from PIL import Image, ImageDraw

args = sys.argv[1:]
out_prefix = args[args.index("--out") + 1]
dirs = [a for a in args if a != "--out" and a != out_prefix]

items = []
for d in dirs:
    cands = json.load(open(os.path.join(d, "candidates.json"), encoding="utf-8"))
    for key, lst in cands.items():
        for i, it in enumerate(lst):
            path = os.path.join(d, f"{key}-{i}.jpg")
            if os.path.exists(path):
                artist = re.sub(r"<[^>]+>", "", it.get("artist", ""))[:22]
                items.append((f"{key}-{i}", artist, path))

CELL_W, CELL_H, COLS = 230, 230, 5
PER_SHEET = 20
for s in range(0, len(items), PER_SHEET):
    chunk = items[s : s + PER_SHEET]
    rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * CELL_W, rows * (CELL_H + 34)), (235, 238, 243))
    dr = ImageDraw.Draw(sheet)
    for n, (label, artist, path) in enumerate(chunk):
        x = (n % COLS) * CELL_W
        y = (n // COLS) * (CELL_H + 34)
        try:
            im = Image.open(path).convert("RGB")
            im.thumbnail((CELL_W - 10, CELL_H - 10))
            sheet.paste(im, (x + (CELL_W - im.width) // 2, y + (CELL_H - im.height) // 2))
        except Exception:
            dr.text((x + 6, y + 10), "ERR", fill=(200, 0, 0))
        dr.text((x + 6, y + CELL_H + 4), label, fill=(0, 0, 0))
        dr.text((x + 6, y + CELL_H + 18), artist, fill=(90, 90, 90))
    out = f"{out_prefix}{s // PER_SHEET + 1}.png"
    sheet.save(out)
    print("saved", out, len(chunk))
