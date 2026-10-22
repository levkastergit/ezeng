"""Fill `cy` for every `en` line in twisters.ts and songs.ts using the Kokoro (espeak) phonemizer.
Run inside the kokoro-onnx virtualenv:
  python scripts/add-cyrillic-lines.py <kokoro-v1.0.onnx> <voices-v1.0.bin>
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cyrillic import ipa_to_cy  # noqa: E402
from kokoro_onnx import Kokoro  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
k = Kokoro(sys.argv[1], sys.argv[2])

pattern = re.compile(r'(en: "([^"]+)",)( cy: "[^"]*",)?')
total = 0
for name in ("twisters.ts", "songs.ts"):
    path = os.path.join(ROOT, "src", "data", name)
    src = open(path, encoding="utf-8").read()

    def repl(m):
        global total
        text = m.group(2)
        ph = k.tokenizer.phonemize(text, lang="en-us")
        cy = ipa_to_cy(ph).replace('"', "")
        total += 1
        return f'{m.group(1)} cy: "{cy}",'

    out = pattern.sub(repl, src)
    open(path, "w", encoding="utf-8", newline="\n").write(out)
    print(name, "done")
print("lines:", total)
