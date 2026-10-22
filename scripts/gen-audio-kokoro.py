"""Generate natural-sounding clips for every course text with Kokoro TTS (ONNX, Apache-2.0).

Usage:
  python gen-audio-kokoro.py <kokoro-v1.0.onnx> <voices-v1.0.bin> <items.json> <out_dir> [voice] [speed]

Writes <out_dir>/<name>.wav (24 kHz mono) for each item and <out_dir>/phonemes.txt for review.
Model files: https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0).
"""
import json
import os
import sys
import time

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

model, voices_bin, items_path, out_dir = sys.argv[1:5]
voice = sys.argv[5] if len(sys.argv) > 5 else "af_heart"
speed = float(sys.argv[6]) if len(sys.argv) > 6 else 0.9

# Heteronyms that the grapheme-to-phoneme step gets wrong without context.
OVERRIDES = {
    "close": "klˈoʊz",
    "Close the door, please.": "klˈoʊz ðə dˈɔːɹ, plˈiːz.",
    "live": "lˈɪv",
    "Use your ultimate now!": "jˈuːz jʊɹ ˈʌltᵻmət nˈaʊ!",
    "Use the scope.": "jˈuːz ðə skˈoʊp.",
    "milord": "mɪlˈɔːɹd",
    "Yes, milord.": "jˈɛs, mɪlˈɔːɹd.",
    "A is clear.": "ˈeɪ ɪz klˈɪɹ.",
    # letter names for the alphabet screen
    "A": "ˈeɪ", "B": "bˈiː", "C": "sˈiː", "D": "dˈiː", "E": "ˈiː", "F": "ˈɛf", "G": "dʒˈiː",
    "H": "ˈeɪtʃ", "I": "ˈaɪ", "J": "dʒˈeɪ", "K": "kˈeɪ", "L": "ˈɛl", "M": "ˈɛm", "N": "ˈɛn",
    "O": "ˈoʊ", "P": "pˈiː", "Q": "kjˈuː", "R": "ˈɑːɹ", "S": "ˈɛs", "T": "tˈiː", "U": "jˈuː",
    "V": "vˈiː", "W": "dˈʌbəljˌuː", "X": "ˈɛks", "Y": "wˈaɪ", "Z": "zˈiː",
}
SUSPICIOUS = ("laɪv", "kloʊs", "ɹˈɛd", "jˈuːs")

k = Kokoro(model, voices_bin)
items = json.load(open(items_path, encoding="utf-8"))
os.makedirs(out_dir, exist_ok=True)
log = open(os.path.join(out_dir, "phonemes.txt"), "w", encoding="utf-8")

t0 = time.time()
flagged = []
skipped = 0
for i, it in enumerate(items, 1):
    text = it["text"]
    name = os.path.splitext(it["file"])[0] + ".wav"
    if os.path.exists(os.path.join(out_dir, name)):
        skipped += 1
        continue
    if text in OVERRIDES:
        ph = OVERRIDES[text]
        samples, sr = k.create(ph, voice=voice, speed=speed, lang="en-us", is_phonemes=True)
    else:
        ph = k.tokenizer.phonemize(text, lang="en-us")
        samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    if any(s in ph for s in SUSPICIOUS):
        flagged.append((text, ph))
    pad_start = np.zeros(int(sr * 0.06), dtype=samples.dtype)
    pad_end = np.zeros(int(sr * 0.12), dtype=samples.dtype)
    sf.write(os.path.join(out_dir, name), np.concatenate([pad_start, samples, pad_end]), sr)
    log.write(f"{text}\t{ph}\n")
    if i % 50 == 0:
        print(f"{i}/{len(items)} clips, {time.time() - t0:.0f}s", flush=True)

log.close()
print(f"done: {len(items) - skipped} new clips ({skipped} already existed) in {time.time() - t0:.0f}s, voice={voice}, speed={speed}")
print("flagged:", len(flagged))
for t, p in flagged:
    print(" ", t, "->", p)
