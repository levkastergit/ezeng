"""Independent check of the karaoke timings: transcribe each recording again WITHOUT the lyrics prompt and measure,
for every timed line, which share of its words is heard within its time window (±1 s).

Usage: python scripts/verify-karaoke.py <songs.json> <songKaraoke.json> [model] [out.json]
With out.json, writes only the confirmed lines (score >= 0.5) of songs with at least half of their timed lines confirmed.
"""
import json
import os
import sys

from faster_whisper import WhisperModel

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module  # noqa: E402

align = import_module("align-songs")


def main():
    songs = {s["id"]: s for s in json.load(open(sys.argv[1], encoding="utf-8"))}
    timings = json.load(open(sys.argv[2], encoding="utf-8"))
    model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else "small.en", device="cpu", compute_type="int8")
    out_path = sys.argv[4] if len(sys.argv) > 4 else None
    confirmed: dict = {}
    for sid, data in timings.items():
        if not data["lines"]:
            continue
        audio = align.load_audio(os.path.join(align.AUDIO, sid + ".mp3"))
        segments, _ = model.transcribe(audio, language="en", beam_size=5, word_timestamps=True, condition_on_previous_text=False)
        heard = [(align.norm(w.word), w.start, w.end) for seg in segments for w in (seg.words or []) if align.norm(w.word)]
        scores = []
        kept = {}
        for li, times in data["lines"].items():
            words = [align.norm(w) for w in songs[sid]["lines"][int(li)]["en"].split()]
            t0, t1 = times[0][0] - 1.0, times[-1][1] + 1.0
            window = [h[0] for h in heard if h[1] >= t0 and h[2] <= t1]
            hit = sum(1 for w in words if any(align.similar(w, x) >= 0.75 for x in window))
            scores.append(hit / len(words))
            if hit / len(words) >= 0.5:
                kept[li] = times
        good = sum(1 for s in scores if s >= 0.5)
        print(f"{sid}: heard {len(heard)} words without prompt; lines confirmed {good}/{len(scores)}, mean {sum(scores) / len(scores):.2f}", flush=True)
        total = sum(1 for l in songs[sid]["lines"] if l["en"])
        if good >= max(2, len(scores) / 2):
            confirmed[sid] = {"coverage": round(len(kept) / total, 2), "lines": kept}
    if out_path:
        json.dump(confirmed, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print("written:", out_path, sorted(confirmed))


if __name__ == "__main__":
    main()
