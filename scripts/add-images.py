"""Add `img` (emoji illustration) to every word in the core course modules m1–m6.
Idempotent: words that already have img are left untouched.
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IMG = {
    # l01
    "hello": "👋", "hi": "🙋", "goodbye": "🚶", "bye": "🫡", "yes": "✅", "no": "❌",
    "please": "🥺", "thank you": "💝", "and": "➕",
    # l02
    "you": "👉", "he": "👨", "she": "👩", "it": "📦", "we": "👥", "they": "👫",
    "my": "🙋‍♀️", "friend": "🧑‍🤝‍🧑", "name": "📛",
    # l03
    "from": "↩️", "Russia": "🇷🇺", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "America": "🇺🇸", "where": "🗺️",
    "live": "🏡", "in": "📥", "city": "🏙️",
    # l04
    "doctor": "👨‍⚕️", "teacher": "👩‍🏫", "student": "🧑‍🎓", "engineer": "👷", "driver": "🚕",
    "work": "💼", "job": "🧑‍💼", "good": "👌",
    # l05
    "mother": "👩‍🦰", "father": "🧔", "sister": "👭", "brother": "👬", "family": "👨‍👩‍👧‍👦",
    "son": "🧒", "daughter": "👧", "have": "🤲",
    # l06
    "one": "1️⃣", "two": "2️⃣", "three": "3️⃣", "four": "4️⃣", "five": "5️⃣",
    "six": "6️⃣", "seven": "7️⃣", "eight": "8️⃣", "nine": "9️⃣", "ten": "🔟",
    # l07
    "house": "🏘️", "room": "🛋️", "kitchen": "🍳", "table": "🍽️", "chair": "🪑",
    "bed": "🛏️", "door": "🚪", "window": "🪟",
    # l08
    "your": "🫵", "his": "👨‍🦱", "her": "👩‍🦱", "our": "👨‍👩‍👧", "their": "👪",
    "this": "👇", "that": "👆", "what": "❔",
    # l09
    "bread": "🍞", "water": "💧", "tea": "🍵", "coffee": "☕", "milk": "🥛",
    "apple": "🍎", "eat": "😋", "drink": "🥤",
    # l10
    "go": "🚶‍♂️", "come": "🏃‍♀️", "see": "👀", "read": "📖", "write": "✍️",
    "like": "👍", "want": "🤩", "know": "🎓", "to": "🔜",
    # l11
    "morning": "🌅", "day": "🌞", "evening": "🌆", "night": "🌙", "today": "📅",
    "now": "⏰", "every": "🔁", "sleep": "😴",
    # l12
    "when": "⏳", "who": "🕵️", "why": "🤔", "how": "🤷", "do": "🔨", "time": "⌚",
    "home": "🏠", "school": "🏫",
    # l13
    "street": "🛣️", "shop": "🏪", "park": "🌳", "bus": "🚌", "car": "🚗",
    "here": "📍", "there": "↗️", "the": "🔖", "at": "🎯",
    # l14
    "left": "⬅️", "right": "➡️", "straight": "⬆️", "turn": "🔄", "stop": "🛑",
    "near": "🤏", "far": "🔭", "walk": "🚶‍♀️",
    # l15
    "money": "💰", "price": "🏷️", "cheap": "🪙", "expensive": "💎", "buy": "🛍️",
    "pay": "💳", "much": "🫗", "many": "🧮",
    # l16
    "can": "💪", "help": "🛟", "open": "🔓", "close": "🔒", "speak": "📢",
    "understand": "💡", "sorry": "😔", "English": "🇬🇧", "me": "🙋‍♂️",
    # l17
    "red": "🟥", "blue": "🟦", "green": "🟩", "black": "⬛", "white": "⬜",
    "big": "🐘", "small": "🐜", "new": "🆕", "dog": "🐶", "cat": "🐱",
    # l18
    "play": "🎮", "watch": "🍿", "cook": "👩‍🍳", "talk": "🗣️", "listen": "🎧",
    "music": "🎵", "TV": "📺", "phone": "📱",
    # l19
    "weather": "🌦️", "sun": "☀️", "rain": "🌧️", "snow": "❄️", "cold": "🥶",
    "hot": "🥵", "warm": "🌤️", "sunny": "😎",
    # l20
    "book": "📚", "film": "🎬", "game": "🎲", "sport": "⚽", "love": "❤️",
    "travel": "✈️", "swim": "🏊", "dance": "💃",
    # l21
    "yesterday": "⏮️", "was": "🕰️", "were": "📜", "last": "⏪", "week": "🗓️",
    "ago": "⌛", "year": "📆", "month": "🌗",
    # l22
    "visit": "🛎️", "call": "📞", "start": "▶️", "finish": "🏁", "stay": "🧘",
    "need": "🙏", "ask": "❓", "answer": "🗨️",
    # l23
    "went": "👣", "saw": "👁️", "had": "🎁", "did": "✔️", "ate": "🍴",
    "came": "🛬", "said": "💬", "took": "✋",
    # l24
    "tomorrow": "⏭️", "will": "🔮", "next": "⏩", "soon": "⏱️", "plan": "📋",
    "trip": "🧳", "weekend": "🎉", "think": "💭",
}

pattern = re.compile(r'(\{ en: "([^"]+)", .*?exRu: "[^"]*")( \},)')
missing = []
added = 0
for f in sorted(glob.glob(os.path.join(ROOT, "src", "data", "m[1-6].ts"))):
    src = open(f, encoding="utf-8").read()

    def repl(m):
        global added
        if " img:" in m.group(0):
            return m.group(0)
        en = m.group(2)
        emoji = IMG.get(en)
        if not emoji:
            missing.append(en)
            return m.group(0)
        added += 1
        return f'{m.group(1)}, img: "{emoji}"{m.group(3)}'

    out = pattern.sub(repl, src)
    if out != src:
        open(f, "w", encoding="utf-8", newline="\n").write(out)

print("img added:", added)
print("missing mappings:", missing)
