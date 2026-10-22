"""Probe the Kokoro model: list voices, show phonemes for tricky words, time one clip.
Usage: python kokoro-probe.py <model.onnx> <voices.bin> <out.wav>
"""
import sys
import time

import soundfile as sf
from kokoro_onnx import Kokoro

model, voices, out = sys.argv[1], sys.argv[2], sys.argv[3]
k = Kokoro(model, voices)
names = k.get_voices()
print("voices:", len(names), [n for n in names if n.startswith(("af_", "am_", "bf_", "bm_"))])

tricky = [
    "close", "Close the door, please.", "read", "I read and write.", "live", "We live in Moscow.",
    "use", "hello", "thank you", "Anna", "Max", "Moscow", "I'm Max.", "Don't go there!", "TV",
]
for t in tricky:
    ph = k.tokenizer.phonemize(t, lang="en-us")
    print(f"{t!r:32} -> {ph}")

t0 = time.time()
samples, sr = k.create("Hello! I am Anna.", voice="af_heart", speed=0.9, lang="en-us")
dt = time.time() - t0
sf.write(out, samples, sr)
print(f"sample: {len(samples)/sr:.2f}s audio at {sr} Hz, generated in {dt:.2f}s")
