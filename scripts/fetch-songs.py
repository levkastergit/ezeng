"""Download the freely licensed song recordings listed below from Wikimedia Commons and convert them to
public/songs/<id>.mp3 (64 kbps mono). Prints duration and license info for src/data/songAudio.ts.
Re-running skips songs that already have an mp3.
"""
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "songs")
UA = "EzEng-song-fetcher/1.0 (educational desktop app; contact: levkasterwork@gmail.com)"
BASE = "https://upload.wikimedia.org/wikipedia/commons/"

SONGS = {
    "s01": ("4/4f/Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg", "Twinkle Twinkle Little Star - sung with full lyrics.ogg"),
    "s02": ("d/de/Happy_birthday.ogg", "Happy birthday.ogg"),
    "s03": ("7/72/Jingle_Bells_%282020%29_-_Starlifter_and_Roots_in_Blue_-_United_States_Air_Force_Band_of_Mid-America.mp3", "Jingle Bells (2020) - Starlifter and Roots in Blue - United States Air Force Band of Mid-America.mp3"),
    "s04": ("6/65/My_Bonnie_lies_over_the_ocean_%28Haydn_Quartet%2C_1901%29.mp3", "My Bonnie lies over the ocean (Haydn Quartet, 1901).mp3"),
    "s05": ("c/c3/Oh_Susanna.ogg", "Oh Susanna.ogg"),
    "s06": ("f/f0/Amazing_Grace_%28USAFB_jazz_vocal%29.ogg", "Amazing Grace (USAFB jazz vocal).ogg"),
    "s07": ("a/a4/Scarborough_Fair.ogg", "Scarborough Fair.ogg"),
    "s08": ("3/37/Greensleeves._La_Juglaresa.opus", "Greensleeves. La Juglaresa.opus"),
    "s09": ("3/37/Auld_Land_Syne_%282020%29_-_Starlifter_and_Roots_in_Blue_-_United_States_Air_Force_Band_of_Mid-America.mp3", "Auld Land Syne (2020) - Starlifter and Roots in Blue - United States Air Force Band of Mid-America.mp3"),
    "s10": ("0/0c/01_When_The_Saints_Go_Marchin%27_In.ogg", "01 When The Saints Go Marchin' In.ogg"),
    "s11": ("", "My Darling Clementine 1946 - trailer - Fragment.wav"),
    "s12": ("f/fc/Home_on_the_range.ogg", "Home on the range.ogg"),
}


def commons_url(title):
    """Resolve a file title to its upload URL through the API (for files whose hash path is unknown)."""
    import urllib.parse
    q = urllib.parse.urlencode({"action": "query", "titles": "File:" + title, "prop": "imageinfo", "iiprop": "url", "format": "json"})
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers={"User-Agent": UA})
    data = json.load(urllib.request.urlopen(req, timeout=60))
    for p in data["query"]["pages"].values():
        return p["imageinfo"][0]["url"]
    raise RuntimeError("not found: " + title)


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, "_tmp")
    os.makedirs(tmp, exist_ok=True)
    for sid, (path, title) in SONGS.items():
        mp3 = os.path.join(OUT, sid + ".mp3")
        if os.path.exists(mp3):
            print(sid, "exists")
            continue
        url = BASE + path if path else commons_url(title)
        src = os.path.join(tmp, sid + os.path.splitext(title)[1].lower())
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as r, open(src, "wb") as fh:
            fh.write(r.read())
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vn", "-b:a", "64k", "-ac", "1", mp3], check=True)
        dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", mp3], capture_output=True, text=True).stdout.strip()
        print(sid, title, "->", os.path.getsize(mp3) // 1024, "KB,", round(float(dur)), "s", flush=True)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


if __name__ == "__main__":
    sys.exit(main())
