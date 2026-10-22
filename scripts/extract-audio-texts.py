"""Collect every English word/sentence from the course data and write
   - an items list for the audio generator (argv[1])
   - src/data/audio-manifest.json (text -> clip file name)
"""
import glob
import hashlib
import json
import os
import re
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items_out = sys.argv[1]

texts = []
seen = set()
pattern = re.compile(r'\b(?:en|ex)\s*:\s*"((?:[^"\\]|\\.)*)"')
for f in sorted(glob.glob(os.path.join(root, 'src', 'data', 'm*.ts'))):
    src = open(f, encoding='utf-8').read()
    for m in pattern.finditer(src):
        t = m.group(1).replace('\\"', '"')
        if t not in seen:
            seen.add(t)
            texts.append(t)

texts.append("Hello! I am learning English.")


def slug(t: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '_', t.lower()).strip('_')[:40]
    return f"{s}_{hashlib.md5(t.encode('utf-8')).hexdigest()[:6]}"


items = [{"text": t, "file": slug(t) + ".mp3"} for t in texts]
assert len({i['file'] for i in items}) == len(items)

with open(items_out, 'w', encoding='utf-8') as fh:
    json.dump(items, fh, ensure_ascii=False, indent=0)

manifest_path = os.path.join(root, 'src', 'data', 'audio-manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as fh:
    json.dump({i['text']: i['file'] for i in items}, fh, ensure_ascii=False, indent=1)

print("texts:", len(items), "chars:", sum(len(t) for t in texts))
print("non-ascii:", [t for t in texts if any(ord(c) > 127 for c in t)][:10])
