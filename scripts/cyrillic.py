"""IPA -> practical Russian (Cyrillic) transcription.

Works both with the hand-written dictionary IPA in src/data (ˈ, ː, r) and with
espeak-ng output from the Kokoro tokenizer (ɹ, ɾ, ɚ, ᵻ, ɐ, ɡ, ˌ).
Stress is marked with a combining acute accent on the stressed vowel.
"""
import re

STRESS = "́"
CY_VOWELS = "аэиоуёюяы"

_TABLE = [
    # r-coloured and w-coloured combinations first
    ("aɪər", "айэр"), ("aʊər", "ауэр"), ("aɪɚ", "айэр"), ("aʊɚ", "ауэр"),
    ("ɜːr", "ёр"), ("ɜr", "ёр"), ("ɝ", "ёр"), ("ɑːr", "ар"), ("ɑr", "ар"), ("ɔːr", "ор"), ("ɔr", "ор"),
    ("ɪər", "иэр"), ("ɪr", "ир"), ("ɛər", "эр"), ("er", "эр"), ("ɛr", "эр"), ("ʊər", "уэр"), ("ʊr", "ур"),
    ("ər", "эр"), ("ɚ", "эр"),
    # y + vowel
    ("juː", "ю"), ("ju", "ю"), ("jʊ", "ю"), ("jʌ", "я"), ("jɑː", "я"), ("jɑ", "я"), ("jɐ", "я"), ("jæ", "я"),
    ("jə", "йэ"), ("jeɪ", "йэй"), ("je", "йэ"), ("jɛ", "йэ"), ("jiː", "йи"), ("jɪ", "йи"), ("ji", "йи"),
    ("jaɪ", "йай"), ("joʊ", "йоу"), ("jɔː", "йо"), ("jɔ", "йо"), ("jɜː", "йё"),
    # diphthongs
    ("aɪ", "ай"), ("eɪ", "эй"), ("oʊ", "оу"), ("əʊ", "оу"), ("aʊ", "ау"), ("ɔɪ", "ой"),
    # vowels
    ("iː", "и"), ("ɪ", "и"), ("i", "и"), ("ᵻ", "и"), ("uː", "у"), ("ʊ", "у"), ("u", "у"),
    ("ɑː", "а"), ("ɑ", "а"), ("ɒ", "о"), ("ɔː", "о"), ("ɔ", "о"), ("æ", "э"), ("ʌ", "а"), ("ɐ", "э"),
    ("ə", "э"), ("ɜː", "ё"), ("ɜ", "ё"), ("e", "э"), ("ɛ", "э"),
    # consonants
    ("tʃ", "ч"), ("dʒ", "дж"), ("θ", "с"), ("ð", "з"), ("ʃ", "ш"), ("ʒ", "ж"),
    ("ŋk", "нк"), ("ŋɡ", "нг"), ("ŋg", "нг"), ("ŋ", "нг"),
    ("j", "й"), ("w", "у"), ("r", "р"), ("ɹ", "р"), ("ɾ", "т"), ("ɡ", "г"), ("g", "г"), ("h", "х"),
    ("l", "л"), ("b", "б"), ("d", "д"), ("f", "ф"), ("k", "к"), ("m", "м"), ("n", "н"), ("p", "п"),
    ("s", "с"), ("t", "т"), ("v", "в"), ("z", "з"),
    # ignorable
    ("ʔ", ""), ("ː", ""), ("ˌ", ""), ("'", ""), ("’", ""), ('"', ""), ("ʰ", ""),
]
_TABLE.sort(key=lambda kv: -len(kv[0]))
_KEYS = [k for k, _ in _TABLE]
_MAP = dict(_TABLE)


def _convert_word(ipa: str) -> str:
    out = []
    pending = False
    i = 0
    while i < len(ipa):
        ch = ipa[i]
        if ch == "ˈ":
            pending = True
            i += 1
            continue
        for k in _KEYS:
            if ipa.startswith(k, i):
                chunk = _MAP[k]
                if k == "w":
                    # before u-like vowels "w" is written "в" (wood — вуд, work — вёрк), otherwise "у"
                    j = i + 1
                    while j < len(ipa) and ipa[j] in "ˈˌ":
                        j += 1
                    chunk = "в" if j < len(ipa) and ipa[j] in "ʊuɜɝɚ" else "у"
                elif k in ("ɜː", "ɜ"):
                    # espeak drops the r after the NURSE vowel in en-us; readers need it: world — вёрлд
                    j = i + len(k)
                    chunk = "ё" if j < len(ipa) and ipa[j] in "rɹ" else "ёр"
                # "w" is written as "у" but is a consonant: it never carries the stress mark
                if pending and chunk and k != "w":
                    for pos, c in enumerate(chunk):
                        if c in CY_VOWELS:
                            if c != "ё":
                                chunk = chunk[: pos + 1] + STRESS + chunk[pos + 1 :]
                            pending = False
                            break
                out.append(chunk)
                i += len(k)
                break
        else:
            out.append(ch)  # punctuation and anything unknown passes through
            i += 1
    word = "".join(out)
    if sum(1 for c in word if c in CY_VOWELS) <= 1:
        word = word.replace(STRESS, "")
    return word


def ipa_to_cy(ipa: str) -> str:
    """Convert an IPA string (one or more words) to Cyrillic reading."""
    s = ipa.strip().strip("/").strip()
    words = re.split(r"(\s+)", s)
    return "".join(w if w.isspace() else _convert_word(w) for w in words)


if __name__ == "__main__":
    import sys

    for arg in sys.argv[1:]:
        print(arg, "->", ipa_to_cy(arg))
