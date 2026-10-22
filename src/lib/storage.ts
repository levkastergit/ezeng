export interface WordState {
  key: string;
  lessonId: string;
  en: string;
  reps: number;
  interval: number;
  ease: number;
  due: number;
  learnedAt: number;
  correct: number;
  wrong: number;
}

export interface LessonState {
  stars: number;
  completed: number;
  lastAt: number;
  bestAccuracy: number;
}

export interface Settings {
  name: string;
  dailyGoal: number;
  rate: number;
  voiceURI: string;
  autoplay: boolean;
  unlockAll: boolean;
  /** Turbo: answers are checked as soon as an option is picked; correct answers advance automatically. */
  turbo: boolean;
  /** No-audio mode: listening tasks become reading tasks, nothing is auto-played. */
  noAudio: boolean;
}

export interface CustomSong {
  id: string;
  title: string;
  lines: { en: string; ru: string }[];
  createdAt: number;
}

export interface TestResult {
  at: number;
  /** Overall ability index 0..5 (1 = A1 … 5 = C1). */
  score: number;
  level: string;
  vocab: number;
  grammar: number;
  reading: number;
}

export interface Progress {
  version: 1;
  xp: number;
  days: Record<string, number>;
  lessons: Record<string, LessonState>;
  words: Record<string, WordState>;
  settings: Settings;
  customSongs: CustomSong[];
  tests: TestResult[];
  talesDone: string[];
  createdAt: number;
}

const KEY = 'ezeng.progress.v1';

export const defaultSettings: Settings = {
  name: 'Ученик',
  dailyGoal: 30,
  rate: 0.9,
  voiceURI: '',
  autoplay: true,
  unlockAll: false,
  turbo: false,
  noAudio: false,
};

export function defaultProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    days: {},
    lessons: {},
    words: {},
    settings: { ...defaultSettings },
    customSongs: [],
    tests: [],
    talesDone: [],
    createdAt: Date.now(),
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const base = defaultProgress();
    return {
      ...base,
      ...parsed,
      days: parsed.days ?? {},
      lessons: parsed.lessons ?? {},
      words: parsed.words ?? {},
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      customSongs: Array.isArray(parsed.customSongs) ? parsed.customSongs : [],
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
      talesDone: Array.isArray(parsed.talesDone) ? parsed.talesDone : [],
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage unavailable: keep in memory only
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
