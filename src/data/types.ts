export interface Word {
  en: string;
  ru: string;
  ipa: string;
  ex: string;
  exRu: string;
  /** Emoji used as the word's illustration (rendered from the bundled Twemoji SVG set). */
  img?: string;
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

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  words: Word[];
  rule: Rule;
  sentences: Sentence[];
  gaps: Gap[];
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
