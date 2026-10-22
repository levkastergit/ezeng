export interface Word {
  en: string;
  ru: string;
  ipa: string;
  ex: string;
  exRu: string;
  /** Emoji used as the word's illustration (rendered from the bundled Twemoji SVG set). */
  img?: string;
  /** Practical Russian reading, e.g. "хэло́у" (generated from `ipa` by scripts/add-cyrillic-words.py). */
  cy?: string;
}

export interface Sentence {
  en: string;
  ru: string;
}

export interface Gap {
  /** Sentence with ___ in place of the missing word */
  text: string;
  answer: string;
  options: string[];
  ru: string;
}

export interface Rule {
  title: string;
  body: string[];
  examples: Sentence[];
  tip?: string;
}

export interface DialogueLine {
  who: "A" | "B";
  en: string;
  ru: string;
}

export interface Quiz {
  q: string;
  options: string[];
  answer: string;
}

export interface Reading {
  title: string;
  paragraphs: { en: string; ru: string }[];
  questions: Quiz[];
}

export type LessonType = "words" | "dialogue" | "reading";

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** "words" (default): cards → rule → drills. "dialogue": cards → dialogue → drills on the lines. "reading": cards → text → comprehension quiz → drills. */
  type?: LessonType;
  words: Word[];
  rule: Rule;
  sentences: Sentence[];
  gaps: Gap[];
  dialogue?: DialogueLine[];
  speakers?: { A: string; B: string };
  reading?: Reading;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  color: string;
  /** 'core' modules unlock one after another; 'theme' modules are open from the start. */
  kind?: 'core' | 'theme';
  lessons: Lesson[];
}
