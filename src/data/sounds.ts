export interface Letter {
  en: string;
  cy: string;
  ipa: string;
}

export interface SoundExample {
  en: string;
  /** Reading for words that are not in the course; course words fall back to their own `cy`. */
  cy?: string;
}

export interface Sound {
  ipa: string;
  cy: string;
  title: string;
  tip: string;
  examples: SoundExample[];
}

export const alphabet: Letter[] = [
  { en: "A", cy: "эй", ipa: "/eɪ/" },
  { en: "B", cy: "би", ipa: "/biː/" },
  { en: "C", cy: "си", ipa: "/siː/" },
  { en: "D", cy: "ди", ipa: "/diː/" },
  { en: "E", cy: "и", ipa: "/iː/" },
  { en: "F", cy: "эф", ipa: "/ef/" },
  { en: "G", cy: "джи", ipa: "/dʒiː/" },
  { en: "H", cy: "эйч", ipa: "/eɪtʃ/" },
  { en: "I", cy: "ай", ipa: "/aɪ/" },
  { en: "J", cy: "джей", ipa: "/dʒeɪ/" },
  { en: "K", cy: "кей", ipa: "/keɪ/" },
  { en: "L", cy: "эл", ipa: "/el/" },
  { en: "M", cy: "эм", ipa: "/em/" },
  { en: "N", cy: "эн", ipa: "/en/" },
  { en: "O", cy: "оу", ipa: "/oʊ/" },
  { en: "P", cy: "пи", ipa: "/piː/" },
  { en: "Q", cy: "кью", ipa: "/kjuː/" },
  { en: "R", cy: "ар", ipa: "/ɑːr/" },
  { en: "S", cy: "эс", ipa: "/es/" },
  { en: "T", cy: "ти", ipa: "/tiː/" },
  { en: "U", cy: "ю", ipa: "/juː/" },
  { en: "V", cy: "ви", ipa: "/viː/" },
  { en: "W", cy: "дабл-ю", ipa: "/ˈdʌbəljuː/" },
  { en: "X", cy: "экс", ipa: "/eks/" },
  { en: "Y", cy: "уай", ipa: "/waɪ/" },
  { en: "Z", cy: "зи", ipa: "/ziː/" },
];

export const sounds: Sound[] = [
  {
    ipa: "/θ/",
    cy: "с",
    title: "th глухое — кончик языка между зубами",
    tip: "Поставь кончик языка между зубами и выдохни, как будто говоришь «с». В русском такого звука нет; в подсказках пишем «с».",
    examples: [{ en: "thank you" }, { en: "three" }, { en: "think" }, { en: "month" }],
  },
  {
    ipa: "/ð/",
    cy: "з",
    title: "th звонкое — то же положение, но с голосом",
    tip: "Язык между зубами, добавь голос: получится что-то между «з» и «д». В подсказках пишем «з».",
    examples: [{ en: "the" }, { en: "this" }, { en: "that" }, { en: "mother" }],
  },
  {
    ipa: "/w/",
    cy: "у",
    title: "w — губы трубочкой, как перед «у»",
    tip: "Это не русское «в»: зубы не касаются губы. Округли губы и быстро «отпусти» их в следующий гласный.",
    examples: [{ en: "we" }, { en: "water" }, { en: "what" }, { en: "window" }],
  },
  {
    ipa: "/ŋ/",
    cy: "нг",
    title: "ng — «н» в нос, без отчётливого «г»",
    tip: "Задняя часть языка поднимается к нёбу, воздух идёт через нос. Звук «г» в конце почти не слышен.",
    examples: [{ en: "morning" }, { en: "English" }, { en: "evening" }, { en: "ping" }],
  },
  {
    ipa: "/r/",
    cy: "р",
    title: "r — без дрожания языка",
    tip: "Кончик языка загнут назад и ничего не касается. Никакой русской раскатистой «р».",
    examples: [{ en: "red" }, { en: "room" }, { en: "read" }, { en: "car" }],
  },
  {
    ipa: "/h/",
    cy: "х",
    title: "h — лёгкий выдох",
    tip: "Гораздо слабее русского «х»: просто тёплый выдох, как когда дышишь на стекло.",
    examples: [{ en: "hello" }, { en: "house" }, { en: "home" }, { en: "hot" }],
  },
  {
    ipa: "/æ/",
    cy: "э",
    title: "a в закрытом слоге — между «а» и «э»",
    tip: "Открой рот как на «а», а скажи «э». В подсказках пишем «э»: cat — кэт.",
    examples: [{ en: "cat" }, { en: "apple" }, { en: "black" }, { en: "map" }],
  },
  {
    ipa: "/ʌ/",
    cy: "а",
    title: "u в закрытом слоге — короткое «а»",
    tip: "Очень короткое «а», как в слове «сад» без растягивания.",
    examples: [{ en: "bus" }, { en: "mother" }, { en: "much" }, { en: "sun" }],
  },
  {
    ipa: "/ɑː/",
    cy: "а",
    title: "Долгое «а»",
    tip: "Глубокое, протяжное «а». В американском так читаются и многие слова с «o»: hot — хат.",
    examples: [{ en: "car" }, { en: "father" }, { en: "park" }, { en: "hot" }],
  },
  {
    ipa: "/ɔː/",
    cy: "о",
    title: "Долгое «о»",
    tip: "Губы округлены, звук тянется: door — дор, four — фор.",
    examples: [{ en: "door" }, { en: "water" }, { en: "four" }, { en: "small" }],
  },
  {
    ipa: "/ɜːr/",
    cy: "ёр",
    title: "er / or / ir / ur под ударением — «ё» без «й»",
    tip: "Похоже на «ё» в слове «мёд», но без начального «й», и дальше идёт американское «р». В подсказках: work — вёрк.",
    examples: [{ en: "work" }, { en: "world" }, { en: "her" }, { en: "turn" }],
  },
  {
    ipa: "/ə/",
    cy: "э",
    title: "Безударный гласный — слабое «э»",
    tip: "Самый частый звук английского. Произносится расслабленно и коротко, как «э» в быстром «тебе».",
    examples: [{ en: "teacher" }, { en: "doctor" }, { en: "sister" }, { en: "America" }],
  },
  {
    ipa: "/iː/ и /ɪ/",
    cy: "и",
    title: "Долгое и короткое «и»",
    tip: "see, tea — долгое напряжённое «и»; it, big — короткое и расслабленное, ближе к «ы». Длина меняет слово: sheep (овца) и ship (корабль).",
    examples: [{ en: "see" }, { en: "tea" }, { en: "it" }, { en: "big" }],
  },
  {
    ipa: "/uː/ и /ʊ/",
    cy: "у",
    title: "Долгое и короткое «у»",
    tip: "food, blue — долгое «у»; good, book — короткое, губы почти не округляются.",
    examples: [{ en: "food" }, { en: "blue" }, { en: "good" }, { en: "book" }],
  },
  {
    ipa: "/eɪ/",
    cy: "эй",
    title: "Дифтонг «эй»",
    tip: "Начинается с «э» и скользит к «й». Так читается буква A в открытом слоге: name — нэйм.",
    examples: [{ en: "name" }, { en: "day" }, { en: "play" }, { en: "eight" }],
  },
  {
    ipa: "/aɪ/",
    cy: "ай",
    title: "Дифтонг «ай»",
    tip: "Буква I в открытом слоге и буква Y в конце слова: hi — хай, my — май.",
    examples: [{ en: "hi" }, { en: "like" }, { en: "night" }, { en: "my" }],
  },
  {
    ipa: "/oʊ/",
    cy: "оу",
    title: "Дифтонг «оу»",
    tip: "Буква O в открытом слоге: go — гоу, home — хоум. Не говори просто «о».",
    examples: [{ en: "go" }, { en: "no" }, { en: "home" }, { en: "snow" }],
  },
  {
    ipa: "/aʊ/",
    cy: "ау",
    title: "Дифтонг «ау»",
    tip: "Сочетания ou и ow: house — хаус, now — нау.",
    examples: [{ en: "house" }, { en: "now" }, { en: "how" }, { en: "town hall" }],
  },
  {
    ipa: "/ɔɪ/",
    cy: "ой",
    title: "Дифтонг «ой»",
    tip: "Сочетания oi и oy: boy — бой, join — джойн.",
    examples: [
      { en: "boy", cy: "бой" },
      { en: "toy", cy: "той" },
      { en: "join", cy: "джойн" },
    ],
  },
  {
    ipa: "/tʃ/",
    cy: "ч",
    title: "ch — «ч»",
    tip: "Как русское «ч», но твёрже: chair — чэр.",
    examples: [{ en: "chair" }, { en: "teacher" }, { en: "kitchen" }, { en: "watch" }],
  },
  {
    ipa: "/dʒ/",
    cy: "дж",
    title: "j и мягкое g — «дж»",
    tip: "Слитное «дж», как в слове «джинсы»: job — джаб, jungle — джангэл.",
    examples: [{ en: "job" }, { en: "jungle" }, { en: "engineer" }, { en: "damage" }],
  },
  {
    ipa: "/ʃ/",
    cy: "ш",
    title: "sh — мягкое «ш»",
    tip: "Среднее между «ш» и «щ»: she — ши, shop — шап.",
    examples: [{ en: "she" }, { en: "shop" }, { en: "English" }, { en: "finish" }],
  },
  {
    ipa: "/j/",
    cy: "й",
    title: "y перед гласным — «й»",
    tip: "yes — йэс, you — ю, year — йир.",
    examples: [{ en: "yes" }, { en: "you" }, { en: "year" }, { en: "young" }],
  },
  {
    ipa: "/z/ и /s/",
    cy: "з / с",
    title: "Окончание -s: звонкое или глухое",
    tip: "После звонких звуков -s читается «з» (dogs — догз), после глухих — «с» (cats — кэтс). То же в глаголах: he reads — ридз, he eats — итс.",
    examples: [
      { en: "dogs", cy: "догз" },
      { en: "cats", cy: "кэтс" },
      { en: "friends", cy: "фрэндз" },
      { en: "students", cy: "стью́дэнтс" },
    ],
  },
  {
    ipa: "—",
    cy: "немые буквы",
    title: "Буквы, которые не читаются",
    tip: "k перед n (know, knife), w перед r (write), gh в середине (night, right), e в конце слова (name, like).",
    examples: [{ en: "knife" }, { en: "know" }, { en: "write" }, { en: "night" }],
  },
];

export const legend: { sign: string; text: string }[] = [
  { sign: "э", text: "звук между «а» и «э» (cat — кэт) или простое «э» (bed — бэд)" },
  { sign: "ё", text: "ударный звук в work, world, her: «ё» без «й»" },
  { sign: "у перед гласной", text: "английское w: we — уи, water — уотэр (губы трубочкой, не «в»)" },
  { sign: "с / з", text: "звуки th: think — синк, this — зис (язык между зубами)" },
  { sign: "нг", text: "носовое ng в конце слова: morning — морнинг" },
  { sign: "а́ (знак над буквой)", text: "ударный слог: hello — хэло́у, teacher — ти́чэр" },
];
