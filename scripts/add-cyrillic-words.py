"""Fill the `cy` (Cyrillic reading) field of every word in src/data/m*.ts from its IPA.
Re-running regenerates all values, so edits go into OVERRIDES below, not into the data files.
"""
import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cyrillic import ipa_to_cy  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OVERRIDES = {
    "TV": "ти-ви́",
    "new": "нью",
    "newbie": "нью́би",
    "neutral": "ню́трэл",
    "duty": "дю́ти",
    "student": "стью́дэнт",
    "counter-terrorist": "ка́унтэр-тэ́рэрист",
    "defuse kit": "дифью́з кит",
    "defuse": "дифью́з",
    "yeah": "йе",
    "btw": "би ти да́бл-ю",
    "lol": "лол",
}

pattern = re.compile(r'(\{ en: "([^"]+)", ru: "[^"]*", ipa: "([^"]+)",)( cy: "[^"]*",)?')
rows = []
changed_files = 0
for f in sorted(glob.glob(os.path.join(ROOT, "src", "data", "m*.ts"))):
    src = open(f, encoding="utf-8").read()

    def repl(m):
        en, ipa = m.group(2), m.group(3)
        cy = OVERRIDES.get(en) or ipa_to_cy(ipa)
        rows.append((en, ipa, cy))
        return f'{m.group(1)} cy: "{cy}",'

    out = pattern.sub(repl, src)
    if out != src:
        open(f, "w", encoding="utf-8", newline="\n").write(out)
        changed_files += 1

print(f"words: {len(rows)}, files changed: {changed_files}")
if "--table" in sys.argv:
    for en, ipa, cy in rows:
        print(f"{en:22} {ipa:26} {cy}")
