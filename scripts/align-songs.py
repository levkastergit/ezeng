"""Word-level karaoke timings for the bundled song recordings.

Transcribes public/songs/<id>.mp3 with faster-whisper (word timestamps), then aligns the recognised words
to the song text from src/data/songs.ts (dumped to JSON first) with a fuzzy dynamic-programming alignment.
Lines with too few matched words stay untimed and are shown without highlighting.

Usage:
  npx esbuild src/data/songs.ts --format=cjs --outfile=<tmp>/songs.cjs
  node -e "console.log(JSON.stringify(require('<tmp>/songs.cjs').songs))" > <tmp>/songs.json
  python scripts/align-songs.py <tmp>/songs.json src/data/songKaraoke.json [model] [ids...]

Output: { "<songId>": { "coverage": 0.83, "lines": { "<lineIndex>": [[start, end], ...one per word...] } } }
"""
import difflib
import json
import os
import re
import subprocess
import sys
import time

import numpy as np

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "public", "songs")

# Spelling variants the recogniser tends to produce for old or dialect words.
EQUIV = {"o'er": "over", "auld": "old", "syne": "sign", "ne'er": "never", "'tis": "tis", "thy": "thigh"}


def norm(w: str) -> str:
    w = w.lower().replace("’", "'")
    w = re.sub(r"[^a-z0-9']+", "", w).strip("'")
    return EQUIV.get(w, w)


def load_audio(path: str) -> np.ndarray:
    """16 kHz mono float32 via ffmpeg (avoids PyAV version issues)."""
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def similar(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def align(lyric: list[str], heard: list[str]) -> dict[int, int]:
    """Global alignment (Needleman-Wunsch) with fuzzy matches; returns lyric index -> heard index."""
    n, m = len(lyric), len(heard)
    gap = -0.4
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    back = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0] = score[i - 1][0] + gap
        back[i][0] = 1
    for j in range(1, m + 1):
        score[0][j] = score[0][j - 1] + gap * 0.5  # skipping recognised words (noise, repeats) is cheaper
        back[0][j] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = similar(lyric[i - 1], heard[j - 1])
            diag = score[i - 1][j - 1] + (1.0 if s >= 0.75 else -0.6)
            up = score[i - 1][j] + gap
            left = score[i][j - 1] + gap * 0.5
            best = max(diag, up, left)
            score[i][j] = best
            back[i][j] = 0 if best == diag else 1 if best == up else 2
    pairs: dict[int, int] = {}
    i, j = n, m
    while i > 0 or j > 0:
        b = back[i][j] if i > 0 and j > 0 else (1 if i > 0 else 2)
        if b == 0:
            if similar(lyric[i - 1], heard[j - 1]) >= 0.75:
                pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif b == 1:
            i -= 1
        else:
            j -= 1
    return pairs


def main():
    songs_json, out_path = sys.argv[1], sys.argv[2]
    model_name = sys.argv[3] if len(sys.argv) > 3 else "small.en"
    only = set(sys.argv[4:])
    songs = json.load(open(songs_json, encoding="utf-8"))
    result = json.load(open(out_path, encoding="utf-8")) if os.path.exists(out_path) else {}
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    for song in songs:
        sid = song["id"]
        if only and sid not in only:
            continue
        mp3 = os.path.join(AUDIO, sid + ".mp3")
        if not os.path.exists(mp3):
            continue
        t0 = time.time()
        first = " ".join(l["en"] for l in song["lines"] if l["en"])[:220]
        segments, _ = model.transcribe(
            load_audio(mp3),
            language="en",
            beam_size=5,
            word_timestamps=True,
            condition_on_previous_text=False,
            vad_filter=False,
            initial_prompt=f"{song['title']}. {first}",
        )
        heard = []
        for seg in segments:
            for w in seg.words or []:
                nw = norm(w.word)
                if nw:
                    heard.append((nw, float(w.start), float(w.end)))
        # Lyric tokens with their (line, word) position.
        tokens, where = [], []
        for li, line in enumerate(song["lines"]):
            if not line["en"]:
                continue
            for wi, raw in enumerate(line["en"].split()):
                nw = norm(raw)
                tokens.append(nw)
                where.append((li, wi))
        pairs = align(tokens, [h[0] for h in heard])
        by_line: dict[int, list] = {}
        for ti, (li, wi) in enumerate(where):
            by_line.setdefault(li, [])
            hj = pairs.get(ti)
            by_line[li].append([heard[hj][1], heard[hj][2]] if hj is not None else None)
        lines_out = {}
        matched_lines = 0
        for li, times in by_line.items():
            got = [t for t in times if t]
            if len(got) < max(1, round(len(times) * 0.4)):
                continue
            # Interpolate words that were not recognised between their timed neighbours.
            filled = list(times)
            for k, t in enumerate(filled):
                if t:
                    continue
                prev = next((filled[p] for p in range(k - 1, -1, -1) if filled[p]), None)
                nxt = next((times[q] for q in range(k + 1, len(times)) if times[q]), None)
                start = prev[1] if prev else (nxt[0] - 0.4 if nxt else 0)
                end = nxt[0] if nxt else start + 0.4
                filled[k] = [start, max(start + 0.12, min(end, start + 0.6))]
            # Keep times monotonic.
            for k in range(1, len(filled)):
                if filled[k][0] < filled[k - 1][0]:
                    filled[k][0] = filled[k - 1][0]
                if filled[k][1] < filled[k][0]:
                    filled[k][1] = filled[k][0] + 0.1
            lines_out[str(li)] = [[round(a, 2), round(b, 2)] for a, b in filled]
            matched_lines += 1
        total_lines = len(by_line)
        coverage = round(matched_lines / total_lines, 2) if total_lines else 0
        result[sid] = {"coverage": coverage, "lines": lines_out}
        print(f"{sid} {song['title']}: heard {len(heard)} words, matched {len(pairs)}/{len(tokens)} words, "
              f"timed lines {matched_lines}/{total_lines}, {time.time() - t0:.0f}s", flush=True)
        json.dump(result, open(out_path, "w", encoding="utf-8"), ensure_ascii=False)
    print("done")


if __name__ == "__main__":
    main()
