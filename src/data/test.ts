/** Item banks for the adaptive placement test. Levels: 1 = A1, 2 = A2, 3 = B1, 4 = B2, 5 = C1. */

export interface VocabItem {
  en: string;
  ru: string;
  lv: number;
}

export interface GrammarItem {
  text: string;
  options: string[];
  answer: string;
  lv: number;
}

export interface ReadingQuestion {
  q: string;
  options: string[];
  answer: string;
}

export interface ReadingItem {
  id: string;
  lv: number;
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

export const LEVEL_NAMES = ["", "A1", "A2", "B1", "B2", "C1"];

export const vocabBank: VocabItem[] = [
  // ---- A1
  { en: "dog", ru: "собака", lv: 1 }, { en: "water", ru: "вода", lv: 1 }, { en: "house", ru: "дом", lv: 1 },
  { en: "big", ru: "большой", lv: 1 }, { en: "red", ru: "красный", lv: 1 }, { en: "book", ru: "книга", lv: 1 },
  { en: "friend", ru: "друг", lv: 1 }, { en: "school", ru: "школа", lv: 1 }, { en: "eat", ru: "есть, кушать", lv: 1 },
  { en: "sleep", ru: "спать", lv: 1 }, { en: "happy", ru: "счастливый", lv: 1 }, { en: "mother", ru: "мама", lv: 1 },
  { en: "car", ru: "машина", lv: 1 }, { en: "sun", ru: "солнце", lv: 1 }, { en: "cat", ru: "кошка", lv: 1 },
  { en: "table", ru: "стол", lv: 1 }, { en: "morning", ru: "утро", lv: 1 }, { en: "cold", ru: "холодный", lv: 1 },
  { en: "play", ru: "играть", lv: 1 }, { en: "read", ru: "читать", lv: 1 }, { en: "door", ru: "дверь", lv: 1 },
  { en: "milk", ru: "молоко", lv: 1 }, { en: "bread", ru: "хлеб", lv: 1 }, { en: "good", ru: "хороший", lv: 1 },
  { en: "new", ru: "новый", lv: 1 }, { en: "small", ru: "маленький", lv: 1 }, { en: "city", ru: "город", lv: 1 },
  { en: "family", ru: "семья", lv: 1 }, { en: "time", ru: "время", lv: 1 }, { en: "work", ru: "работа", lv: 1 },
  { en: "go", ru: "идти", lv: 1 }, { en: "see", ru: "видеть", lv: 1 }, { en: "day", ru: "день", lv: 1 },
  { en: "night", ru: "ночь", lv: 1 }, { en: "white", ru: "белый", lv: 1 }, { en: "green", ru: "зелёный", lv: 1 },
  { en: "apple", ru: "яблоко", lv: 1 }, { en: "tea", ru: "чай", lv: 1 }, { en: "name", ru: "имя", lv: 1 },
  { en: "love", ru: "любовь", lv: 1 },
  // ---- A2
  { en: "weather", ru: "погода", lv: 2 }, { en: "journey", ru: "путешествие", lv: 2 }, { en: "cheap", ru: "дешёвый", lv: 2 },
  { en: "expensive", ru: "дорогой", lv: 2 }, { en: "neighbor", ru: "сосед", lv: 2 }, { en: "kitchen", ru: "кухня", lv: 2 },
  { en: "hospital", ru: "больница", lv: 2 }, { en: "tired", ru: "усталый", lv: 2 }, { en: "busy", ru: "занятой", lv: 2 },
  { en: "arrive", ru: "прибывать", lv: 2 }, { en: "borrow", ru: "брать взаймы", lv: 2 }, { en: "choose", ru: "выбирать", lv: 2 },
  { en: "dangerous", ru: "опасный", lv: 2 }, { en: "delicious", ru: "вкусный", lv: 2 }, { en: "empty", ru: "пустой", lv: 2 },
  { en: "famous", ru: "знаменитый", lv: 2 }, { en: "healthy", ru: "здоровый", lv: 2 }, { en: "holiday", ru: "отпуск, праздник", lv: 2 },
  { en: "invite", ru: "приглашать", lv: 2 }, { en: "lucky", ru: "везучий", lv: 2 }, { en: "meeting", ru: "встреча, собрание", lv: 2 },
  { en: "noisy", ru: "шумный", lv: 2 }, { en: "quiet", ru: "тихий", lv: 2 }, { en: "remember", ru: "помнить", lv: 2 },
  { en: "repair", ru: "чинить", lv: 2 }, { en: "ticket", ru: "билет", lv: 2 }, { en: "village", ru: "деревня", lv: 2 },
  { en: "wait", ru: "ждать", lv: 2 }, { en: "nervous", ru: "нервный", lv: 2 }, { en: "polite", ru: "вежливый", lv: 2 },
  { en: "prefer", ru: "предпочитать", lv: 2 }, { en: "stairs", ru: "лестница", lv: 2 }, { en: "umbrella", ru: "зонт", lv: 2 },
  { en: "forget", ru: "забывать", lv: 2 }, { en: "careful", ru: "осторожный", lv: 2 }, { en: "almost", ru: "почти", lv: 2 },
  { en: "enough", ru: "достаточно", lv: 2 }, { en: "early", ru: "рано", lv: 2 }, { en: "late", ru: "поздно", lv: 2 },
  { en: "together", ru: "вместе", lv: 2 },
  // ---- B1
  { en: "achieve", ru: "достигать", lv: 3 }, { en: "advice", ru: "совет", lv: 3 }, { en: "ancient", ru: "древний", lv: 3 },
  { en: "appointment", ru: "назначенная встреча", lv: 3 }, { en: "attitude", ru: "отношение, позиция", lv: 3 }, { en: "average", ru: "средний", lv: 3 },
  { en: "behavior", ru: "поведение", lv: 3 }, { en: "benefit", ru: "выгода, польза", lv: 3 }, { en: "challenge", ru: "трудная задача, вызов", lv: 3 },
  { en: "confident", ru: "уверенный", lv: 3 }, { en: "convenient", ru: "удобный", lv: 3 }, { en: "decrease", ru: "уменьшаться", lv: 3 },
  { en: "deliver", ru: "доставлять", lv: 3 }, { en: "describe", ru: "описывать", lv: 3 }, { en: "disappointed", ru: "разочарованный", lv: 3 },
  { en: "environment", ru: "окружающая среда", lv: 3 }, { en: "experience", ru: "опыт", lv: 3 }, { en: "familiar", ru: "знакомый", lv: 3 },
  { en: "generous", ru: "щедрый", lv: 3 }, { en: "improve", ru: "улучшать", lv: 3 }, { en: "independent", ru: "независимый", lv: 3 },
  { en: "injury", ru: "травма", lv: 3 }, { en: "knowledge", ru: "знание", lv: 3 }, { en: "luggage", ru: "багаж", lv: 3 },
  { en: "opportunity", ru: "возможность", lv: 3 }, { en: "patient", ru: "терпеливый", lv: 3 }, { en: "pleasure", ru: "удовольствие", lv: 3 },
  { en: "previous", ru: "предыдущий", lv: 3 }, { en: "probably", ru: "вероятно", lv: 3 }, { en: "protect", ru: "защищать", lv: 3 },
  { en: "recipe", ru: "рецепт", lv: 3 }, { en: "relationship", ru: "отношения", lv: 3 }, { en: "responsible", ru: "ответственный", lv: 3 },
  { en: "satisfied", ru: "довольный", lv: 3 }, { en: "suggest", ru: "предлагать", lv: 3 }, { en: "surface", ru: "поверхность", lv: 3 },
  { en: "survey", ru: "опрос", lv: 3 }, { en: "temperature", ru: "температура", lv: 3 }, { en: "valuable", ru: "ценный", lv: 3 },
  { en: "whole", ru: "целый", lv: 3 },
  // ---- B2
  { en: "abundant", ru: "обильный", lv: 4 }, { en: "acquire", ru: "приобретать", lv: 4 }, { en: "ambiguous", ru: "двусмысленный", lv: 4 },
  { en: "anticipate", ru: "предвидеть", lv: 4 }, { en: "assess", ru: "оценивать", lv: 4 }, { en: "coherent", ru: "связный, логичный", lv: 4 },
  { en: "compel", ru: "принуждать", lv: 4 }, { en: "conscientious", ru: "добросовестный", lv: 4 }, { en: "contradict", ru: "противоречить", lv: 4 },
  { en: "deteriorate", ru: "ухудшаться", lv: 4 }, { en: "diligent", ru: "прилежный", lv: 4 }, { en: "elaborate", ru: "подробный, сложный", lv: 4 },
  { en: "emphasize", ru: "подчёркивать", lv: 4 }, { en: "feasible", ru: "осуществимый", lv: 4 }, { en: "fluctuate", ru: "колебаться", lv: 4 },
  { en: "hinder", ru: "мешать, препятствовать", lv: 4 }, { en: "implication", ru: "следствие, подтекст", lv: 4 }, { en: "inevitable", ru: "неизбежный", lv: 4 },
  { en: "insight", ru: "проницательность", lv: 4 }, { en: "integrity", ru: "честность, целостность", lv: 4 }, { en: "meticulous", ru: "дотошный", lv: 4 },
  { en: "negligible", ru: "ничтожно малый", lv: 4 }, { en: "notion", ru: "понятие, представление", lv: 4 }, { en: "obsolete", ru: "устаревший", lv: 4 },
  { en: "perceive", ru: "воспринимать", lv: 4 }, { en: "persistent", ru: "настойчивый", lv: 4 }, { en: "plausible", ru: "правдоподобный", lv: 4 },
  { en: "precaution", ru: "мера предосторожности", lv: 4 }, { en: "reluctant", ru: "неохотный", lv: 4 }, { en: "resilient", ru: "стойкий", lv: 4 },
  { en: "scrutiny", ru: "тщательная проверка", lv: 4 }, { en: "subsequent", ru: "последующий", lv: 4 }, { en: "substantial", ru: "существенный", lv: 4 },
  { en: "tedious", ru: "утомительный", lv: 4 }, { en: "thrive", ru: "процветать", lv: 4 }, { en: "trivial", ru: "пустяковый", lv: 4 },
  { en: "undermine", ru: "подрывать", lv: 4 }, { en: "versatile", ru: "разносторонний", lv: 4 }, { en: "vulnerable", ru: "уязвимый", lv: 4 },
  { en: "withstand", ru: "выдерживать", lv: 4 },
  // ---- C1
  { en: "alleviate", ru: "облегчать (боль, проблему)", lv: 5 }, { en: "ameliorate", ru: "улучшать положение", lv: 5 }, { en: "belligerent", ru: "воинственный", lv: 5 },
  { en: "candid", ru: "откровенный", lv: 5 }, { en: "circumvent", ru: "обходить (правило)", lv: 5 }, { en: "conspicuous", ru: "бросающийся в глаза", lv: 5 },
  { en: "convoluted", ru: "запутанный", lv: 5 }, { en: "cursory", ru: "беглый, поверхностный", lv: 5 }, { en: "derogatory", ru: "уничижительный", lv: 5 },
  { en: "disparate", ru: "несопоставимый, разнородный", lv: 5 }, { en: "ephemeral", ru: "мимолётный", lv: 5 }, { en: "equivocal", ru: "уклончивый", lv: 5 },
  { en: "exacerbate", ru: "усугублять", lv: 5 }, { en: "fastidious", ru: "привередливый", lv: 5 }, { en: "flagrant", ru: "вопиющий", lv: 5 },
  { en: "gregarious", ru: "общительный", lv: 5 }, { en: "idiosyncratic", ru: "своеобразный", lv: 5 }, { en: "impeccable", ru: "безупречный", lv: 5 },
  { en: "incessant", ru: "непрестанный", lv: 5 }, { en: "insidious", ru: "коварный", lv: 5 }, { en: "juxtapose", ru: "сопоставлять рядом", lv: 5 },
  { en: "lucid", ru: "ясный, понятный", lv: 5 }, { en: "magnanimous", ru: "великодушный", lv: 5 }, { en: "nefarious", ru: "гнусный", lv: 5 },
  { en: "obstinate", ru: "упрямый", lv: 5 }, { en: "ostensible", ru: "мнимый, показной", lv: 5 }, { en: "pernicious", ru: "пагубный", lv: 5 },
  { en: "pragmatic", ru: "прагматичный", lv: 5 }, { en: "precarious", ru: "шаткий, ненадёжный", lv: 5 }, { en: "prolific", ru: "плодовитый", lv: 5 },
  { en: "quintessential", ru: "самый типичный", lv: 5 }, { en: "recalcitrant", ru: "непокорный", lv: 5 }, { en: "scrupulous", ru: "щепетильный", lv: 5 },
  { en: "superfluous", ru: "излишний", lv: 5 }, { en: "tenacious", ru: "упорный", lv: 5 }, { en: "ubiquitous", ru: "вездесущий", lv: 5 },
  { en: "unequivocal", ru: "недвусмысленный", lv: 5 }, { en: "venerable", ru: "почтенный", lv: 5 }, { en: "vindicate", ru: "оправдывать", lv: 5 },
  { en: "zealous", ru: "рьяный", lv: 5 },
];

export const grammarBank: GrammarItem[] = [
  // ---- A1
  { text: "I ___ a student.", options: ["am", "is", "are", "be"], answer: "am", lv: 1 },
  { text: "She ___ coffee every morning.", options: ["drinks", "drink", "drinking", "drank"], answer: "drinks", lv: 1 },
  { text: "There ___ two chairs in the room.", options: ["are", "is", "am", "be"], answer: "are", lv: 1 },
  { text: "___ you like tea?", options: ["Do", "Does", "Are", "Is"], answer: "Do", lv: 1 },
  { text: "This is ___ book.", options: ["my", "me", "I", "mine"], answer: "my", lv: 1 },
  { text: "He ___ work today.", options: ["doesn't", "don't", "isn't", "not"], answer: "doesn't", lv: 1 },
  { text: "We ___ in Moscow.", options: ["live", "lives", "living", "lived"], answer: "live", lv: 1 },
  { text: "I have ___ apple.", options: ["an", "a", "the", "some"], answer: "an", lv: 1 },
  { text: "___ is your name?", options: ["What", "Who", "Where", "How"], answer: "What", lv: 1 },
  { text: "They ___ my friends.", options: ["are", "is", "am", "be"], answer: "are", lv: 1 },
  // ---- A2
  { text: "I ___ to London last year.", options: ["went", "go", "gone", "going"], answer: "went", lv: 2 },
  { text: "She is ___ than her brother.", options: ["taller", "tall", "tallest", "more tall"], answer: "taller", lv: 2 },
  { text: "We ___ TV when he called.", options: ["were watching", "watched", "watch", "are watching"], answer: "were watching", lv: 2 },
  { text: "Have you ever ___ sushi?", options: ["eaten", "ate", "eat", "eating"], answer: "eaten", lv: 2 },
  { text: "You ___ wear a helmet. It's the law.", options: ["must", "can", "may", "might"], answer: "must", lv: 2 },
  { text: "If it rains, we ___ at home.", options: ["will stay", "stay", "stayed", "would stay"], answer: "will stay", lv: 2 },
  { text: "There isn't ___ milk left.", options: ["any", "some", "no", "many"], answer: "any", lv: 2 },
  { text: "I'm interested ___ history.", options: ["in", "on", "at", "for"], answer: "in", lv: 2 },
  { text: "She ___ to the gym twice a week.", options: ["goes", "go", "is going", "went"], answer: "goes", lv: 2 },
  { text: "This is the ___ film I have ever seen.", options: ["best", "good", "better", "most good"], answer: "best", lv: 2 },
  // ---- B1
  { text: "I've been living here ___ 2015.", options: ["since", "for", "from", "during"], answer: "since", lv: 3 },
  { text: "If I ___ you, I would take the job.", options: ["were", "am", "would be", "be"], answer: "were", lv: 3 },
  { text: "The letter ___ yesterday.", options: ["was sent", "sent", "is sent", "has sent"], answer: "was sent", lv: 3 },
  { text: "She asked me where ___.", options: ["I lived", "did I live", "do I live", "I am live"], answer: "I lived", lv: 3 },
  { text: "By the time we arrived, the film ___.", options: ["had started", "started", "has started", "starts"], answer: "had started", lv: 3 },
  { text: "You ___ have told me earlier!", options: ["should", "must", "would", "can"], answer: "should", lv: 3 },
  { text: "He's used to ___ early.", options: ["getting up", "get up", "got up", "gets up"], answer: "getting up", lv: 3 },
  { text: "I wish I ___ more time.", options: ["had", "have", "would have", "having"], answer: "had", lv: 3 },
  { text: "The man ___ lives next door is a doctor.", options: ["who", "which", "whose", "whom"], answer: "who", lv: 3 },
  { text: "She made me ___ for an hour.", options: ["wait", "to wait", "waiting", "waited"], answer: "wait", lv: 3 },
  // ---- B2
  { text: "Hardly ___ the house when it started to rain.", options: ["had I left", "I had left", "did I leave", "I left"], answer: "had I left", lv: 4 },
  { text: "The report ___ by Friday.", options: ["must be finished", "must finish", "must have finished", "must finishing"], answer: "must be finished", lv: 4 },
  { text: "Not only ___ late, but he also forgot the tickets.", options: ["was he", "he was", "he is", "is he"], answer: "was he", lv: 4 },
  { text: "I'd rather you ___ smoke here.", options: ["didn't", "don't", "wouldn't", "not"], answer: "didn't", lv: 4 },
  { text: "___ the bad weather, we went hiking.", options: ["Despite", "Although", "However", "Even"], answer: "Despite", lv: 4 },
  { text: "She denied ___ the money.", options: ["taking", "to take", "take", "took"], answer: "taking", lv: 4 },
  { text: "It's high time we ___.", options: ["left", "leave", "will leave", "have left"], answer: "left", lv: 4 },
  { text: "He speaks as if he ___ everything.", options: ["knew", "knows", "know", "will know"], answer: "knew", lv: 4 },
  { text: "The project, ___ was delayed twice, has finally finished.", options: ["which", "that", "what", "whose"], answer: "which", lv: 4 },
  { text: "Were it not for your help, I ___.", options: ["would have failed", "will fail", "failed", "had failed"], answer: "would have failed", lv: 4 },
];

export const readingBank: ReadingItem[] = [
  {
    id: "r1a",
    lv: 1,
    title: "My Family",
    text: "My name is Tom. I am ten years old. I live in a small house with my family. My mother is a teacher and my father is a driver. I have a sister. Her name is Kate. She is seven. We have a dog. His name is Max. He is big and brown. Every morning we walk with Max in the park.",
    questions: [
      { q: "How old is Tom?", options: ["10", "7", "12", "5"], answer: "10" },
      { q: "What is Tom's father?", options: ["a driver", "a teacher", "a doctor", "a student"], answer: "a driver" },
      { q: "Who is Max?", options: ["a dog", "a brother", "a sister", "a cat"], answer: "a dog" },
    ],
  },
  {
    id: "r1b",
    lv: 1,
    title: "In the Morning",
    text: "Anna gets up at seven. She drinks tea and eats bread with butter. Then she goes to school by bus. School starts at eight. Anna likes English and music. After school she plays with her friends. In the evening she reads a book and goes to bed at nine.",
    questions: [
      { q: "What does Anna drink in the morning?", options: ["tea", "coffee", "milk", "water"], answer: "tea" },
      { q: "How does she go to school?", options: ["by bus", "by car", "on foot", "by bike"], answer: "by bus" },
      { q: "When does she go to bed?", options: ["at nine", "at seven", "at eight", "at ten"], answer: "at nine" },
    ],
  },
  {
    id: "r1c",
    lv: 1,
    title: "My Room",
    text: "My room is small but nice. There is a bed near the window. There is a table and a chair. On the table there is a computer and some books. The walls are blue. I have a big picture of a cat on the wall. I like my room because it is quiet.",
    questions: [
      { q: "Where is the bed?", options: ["near the window", "near the door", "under the table", "in the kitchen"], answer: "near the window" },
      { q: "What color are the walls?", options: ["blue", "white", "green", "red"], answer: "blue" },
      { q: "Why does the writer like the room?", options: ["it is quiet", "it is big", "it is new", "it has a TV"], answer: "it is quiet" },
    ],
  },
  {
    id: "r2a",
    lv: 2,
    title: "A Trip to the Sea",
    text: "Last summer my friends and I went to the sea. We took a train early in the morning and arrived at noon. The hotel was small but clean, and it was near the beach. Every day we swam and played volleyball. One evening we took a boat and saw dolphins. It was the best moment of the trip. We came back home tired but happy.",
    questions: [
      { q: "How did they travel to the sea?", options: ["by train", "by car", "by plane", "by bus"], answer: "by train" },
      { q: "Where was the hotel?", options: ["near the beach", "in the city center", "far from the sea", "next to the station"], answer: "near the beach" },
      { q: "What did they see from the boat?", options: ["dolphins", "fish", "birds", "a ship"], answer: "dolphins" },
    ],
  },
  {
    id: "r2b",
    lv: 2,
    title: "Anna's New Job",
    text: "Anna started a new job in a café last month. She works from eight to four, five days a week. At first it was difficult because she didn't know the menu, but her colleagues helped her. Now she can make twenty kinds of coffee. The customers are friendly, and some of them come every day. Anna likes her job, but she wants to study design in the future.",
    questions: [
      { q: "When did Anna start the job?", options: ["last month", "last year", "yesterday", "last week"], answer: "last month" },
      { q: "Why was it difficult at first?", options: ["she didn't know the menu", "the customers were rude", "the café was far", "she worked at night"], answer: "she didn't know the menu" },
      { q: "What does Anna want to do in the future?", options: ["study design", "open a café", "become a teacher", "move abroad"], answer: "study design" },
    ],
  },
  {
    id: "r2c",
    lv: 2,
    title: "The Lost Dog",
    text: "On Saturday Peter lost his dog, Rex, in the park. He looked for him for two hours, but he couldn't find him. He put a photo of Rex on the internet and asked people for help. The next morning a woman called. She found Rex near the river and gave him some food. Peter was very happy. He thanked the woman and bought her flowers.",
    questions: [
      { q: "Where did Peter lose Rex?", options: ["in the park", "near the river", "at home", "in the shop"], answer: "in the park" },
      { q: "How did Peter look for Rex?", options: ["he put a photo online", "he called the police", "he went to the river", "he waited at home"], answer: "he put a photo online" },
      { q: "Who found Rex?", options: ["a woman", "a boy", "a policeman", "Peter's friend"], answer: "a woman" },
    ],
  },
  {
    id: "r3a",
    lv: 3,
    title: "Learning to Cook",
    text: "When I moved to another city for university, I couldn't cook at all. For the first month I ate sandwiches and ordered pizza, which was expensive and unhealthy. Then my grandmother sent me her recipe book. I started with simple dishes, like soup and pasta, and made a lot of mistakes. Once I burned the rice so badly that my neighbors knocked on the door. But I kept trying, and after a few months cooking became my favorite way to relax. Now my friends come to my place for dinner every Friday.",
    questions: [
      { q: "Why did the writer eat pizza at first?", options: ["they couldn't cook", "they liked it most", "it was cheap", "there was no kitchen"], answer: "they couldn't cook" },
      { q: "What happened when the rice burned?", options: ["the neighbors knocked on the door", "the writer gave up", "the grandmother called", "the friends laughed"], answer: "the neighbors knocked on the door" },
      { q: "How does the writer feel about cooking now?", options: ["it helps to relax", "it is boring", "it is too expensive", "it is stressful"], answer: "it helps to relax" },
    ],
  },
  {
    id: "r3b",
    lv: 3,
    title: "A Festival in a Small Town",
    text: "Every September the small town where I grew up holds a harvest festival. Farmers bring apples, pumpkins and honey to the main square, and local bands play all afternoon. The most popular event is the pie competition, which my aunt has won three times. Tourists from the nearby city come to buy fresh food and take photos. Some residents complain about the traffic, but most people agree that the festival brings money and energy to the town. This year, for the first time, the organizers added a night market with lanterns.",
    questions: [
      { q: "When is the festival?", options: ["in September", "in July", "in December", "in May"], answer: "in September" },
      { q: "What is the most popular event?", options: ["the pie competition", "the concert", "the night market", "the photo contest"], answer: "the pie competition" },
      { q: "What do some residents complain about?", options: ["the traffic", "the noise", "the prices", "the tourists' photos"], answer: "the traffic" },
    ],
  },
  {
    id: "r3c",
    lv: 3,
    title: "Working from Home",
    text: "Two years ago our company allowed everyone to work from home two days a week. At first I loved it: no travelling, no noisy office, and I could start work in my pajamas. However, after a few months I noticed some problems. It was hard to stop working in the evening, and I missed talking to my colleagues. So I made some rules for myself. I always work at the same desk, I finish at six, and I meet a colleague for lunch once a week. Now I think the mix of home and office is the best option.",
    questions: [
      { q: "How often can employees work from home?", options: ["two days a week", "every day", "once a month", "never"], answer: "two days a week" },
      { q: "What problem did the writer notice?", options: ["it was hard to stop working", "the internet was slow", "the boss was unhappy", "there was too much travelling"], answer: "it was hard to stop working" },
      { q: "Which rule did the writer make?", options: ["finish at six", "work on weekends", "eat lunch alone", "start at five"], answer: "finish at six" },
    ],
  },
  {
    id: "r4a",
    lv: 4,
    title: "Electric Scooters",
    text: "Shared electric scooters appeared in many cities almost overnight, promising a cheap and green alternative to short car trips. Supporters point out that a scooter uses far less energy than a car and takes up almost no parking space. Critics, however, argue that the benefits are overstated: many riders would otherwise have walked or cycled, and the scooters themselves have a short lifespan, which raises questions about their real environmental cost. Cities have responded in different ways, from strict speed limits and designated parking zones to complete bans. What seems clear is that the technology has outpaced the rules designed to manage it.",
    questions: [
      { q: "What do supporters emphasize?", options: ["low energy use and little parking space", "high speed", "low price for operators", "safety for riders"], answer: "low energy use and little parking space" },
      { q: "What do critics say about the environmental benefit?", options: ["it is overstated", "it is proven", "it is impossible to measure", "it depends on the city"], answer: "it is overstated" },
      { q: "What is the author's main conclusion?", options: ["regulation lags behind the technology", "scooters should be banned", "scooters are the future of transport", "cars are better"], answer: "regulation lags behind the technology" },
    ],
  },
  {
    id: "r4b",
    lv: 4,
    title: "Why We Forget Names",
    text: "Most people admit that they forget a new acquaintance's name within seconds of hearing it, yet they remember the person's face and job with no difficulty. Psychologists explain this with a simple observation: a name is arbitrary. Nothing about a person tells you that they are called Michael rather than David, so the brain has nothing to attach the word to. A face, by contrast, is rich in meaningful detail, and a job connects to a whole network of knowledge. The practical advice follows from the explanation: repeat the name aloud, link it to something concrete, and use it in the conversation before it fades.",
    questions: [
      { q: "Why are names hard to remember, according to psychologists?", options: ["they are arbitrary", "they are too long", "people don't listen", "they are unusual"], answer: "they are arbitrary" },
      { q: "Why are faces easier to remember?", options: ["they are rich in meaningful detail", "they are seen more often", "they are colorful", "people like faces"], answer: "they are rich in meaningful detail" },
      { q: "What advice does the text give?", options: ["repeat the name and link it to something concrete", "write the name down", "ask for the name again later", "avoid using names"], answer: "repeat the name and link it to something concrete" },
    ],
  },
  {
    id: "r4c",
    lv: 4,
    title: "A Village Without Cars",
    text: "In a small Alpine village, cars have been banned from the center for over forty years. Visitors leave their vehicles in a car park at the bottom of the valley and take a train up the mountain. Residents move goods on electric carts and the occasional horse-drawn sleigh. The decision was controversial at the time, with shop owners fearing a loss of customers, but tourism has grown steadily since. The silence, locals say, has become the village's main attraction. Other mountain towns have studied the model, though few have copied it, mainly because their geography makes a single access point impossible.",
    questions: [
      { q: "How do visitors reach the village?", options: ["by train", "by car", "on foot", "by bus"], answer: "by train" },
      { q: "What did shop owners fear?", options: ["losing customers", "noise", "higher taxes", "the train"], answer: "losing customers" },
      { q: "Why haven't other towns copied the model?", options: ["because of their geography", "because of the cost", "because residents oppose it", "because of the law"], answer: "because of their geography" },
    ],
  },
];
