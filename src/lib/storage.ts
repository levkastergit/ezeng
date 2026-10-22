import { dateKey } from './utils';

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
  /** Short synthesized sounds for correct / wrong answers. */
  sounds: boolean;
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

export interface DailyStats {
  lessons: number;
  reviews: number;
  /** Answers given in the endless mode. */
  endless: number;
  correct: number;
  tales: number;
  /** Daily-quest bonus already granted. */
  bonus?: boolean;
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
  /** Best streak of correct answers in the endless mode. */
  endlessBest?: number;
  endlessAnswers?: number;
  /** Unlocked achievements: id → timestamp. */
  achievements?: Record<string, number>;
  /** Per-day activity counters (date key → stats), used for daily quests. */
  daily?: Record<string, DailyStats>;
  /** Last modification time, used to reconcile with the server copy. */
  updatedAt?: number;
  createdAt: number;
}

/** Storage scope: "v1" is the local guest profile, "u_<id>" an account. */
let scope = 'v1';
export function setStorageScope(s: string) {
  scope = s;
}
export function getStorageScope() {
  return scope;
}
function progressKey() {
  return `ezeng.progress.${scope}`;
}
export const LEGACY_KEY = 'ezeng.progress.v1';

export const defaultSettings: Settings = {
  name: 'Ученик',
  dailyGoal: 30,
  rate: 0.9,
  voiceURI: '',
  autoplay: true,
  unlockAll: false,
  turbo: false,
  noAudio: false,
  sounds: true,
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

/** Fills in defaults for a progress object that may come from an older version or from the server. */
export function normalizeProgress(parsed: Partial<Progress>): Progress {
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
      achievements: parsed.achievements && typeof parsed.achievements === 'object' ? parsed.achievements : {},
      daily: parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {},
  };
}

export function loadProgress(key: string = progressKey()): Progress {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultProgress();
    return normalizeProgress(JSON.parse(raw) as Partial<Progress>);
  } catch {
    return defaultProgress();
  }
}

export function hasStoredProgress(key: string = progressKey()): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function saveProgress(p: Progress, key: string = progressKey()): void {
  try {
    localStorage.setItem(key, JSON.stringify(p));
  } catch {
    // storage unavailable: keep in memory only
  }
}

export function clearProgress(key: string = progressKey()): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function emptyDaily(): DailyStats {
  return { lessons: 0, reviews: 0, endless: 0, correct: 0, tales: 0 };
}

/** Adds activity counters for today (used by the daily quests). */
export function bumpDaily(p: Progress, patch: Partial<Omit<DailyStats, 'bonus'>>, date: string = dateKey()): Progress {
  const cur = p.daily?.[date] ?? emptyDaily();
  const next: DailyStats = { ...cur };
  (Object.keys(patch) as (keyof typeof patch)[]).forEach((k) => {
    next[k] = (cur[k] ?? 0) + (patch[k] ?? 0);
  });
  return { ...p, daily: { ...(p.daily ?? {}), [date]: next } };
}
