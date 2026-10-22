import { allLessons, modules } from '../data/course';
import type { Lesson, Module, Word } from '../data/types';
import type { DailyStats, Progress } from './storage';
import { emptyDaily } from './storage';
import { dateKey } from './utils';

/* ------------------------------------------------------------------ levels */

export const LEVELS: { xp: number; title: string }[] = [
  { xp: 0, title: 'Новичок' },
  { xp: 100, title: 'Ученик' },
  { xp: 300, title: 'Знаток слов' },
  { xp: 600, title: 'Собеседник' },
  { xp: 1000, title: 'Путешественник' },
  { xp: 1500, title: 'Эрудит' },
  { xp: 2200, title: 'Переводчик' },
  { xp: 3000, title: 'Мастер' },
  { xp: 4000, title: 'Профессор' },
  { xp: 5500, title: 'Легенда' },
];

export interface LevelInfo {
  level: number;
  title: string;
  from: number;
  /** XP needed for the next level; equals `from` on the last level. */
  to: number;
  pct: number;
  nextTitle: string | null;
}

export function levelFor(xp: number): LevelInfo {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i += 1;
  const from = LEVELS[i].xp;
  const next = LEVELS[i + 1];
  const to = next ? next.xp : from;
  const pct = next ? Math.min(1, (xp - from) / (to - from)) : 1;
  return { level: i + 1, title: LEVELS[i].title, from, to, pct, nextTitle: next ? next.title : null };
}

/* ------------------------------------------------------------------ daily quests */

export const QUEST_BONUS = 25;

export interface Quest {
  id: string;
  emoji: string;
  title: string;
  target: number;
  value: number;
  done: boolean;
}

export function todayStats(p: Progress, date: string = dateKey()): DailyStats {
  return p.daily?.[date] ?? emptyDaily();
}

export function hashStr(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

type QuestDef = { id: string; emoji: string; title: string; target: number; value: (p: Progress, d: DailyStats, date: string) => number };

const SLOT_A: QuestDef[] = [
  { id: 'lesson1', emoji: '📘', title: 'Пройди один урок', target: 1, value: (_p, d) => d.lessons },
  { id: 'lesson2', emoji: '📚', title: 'Пройди два урока', target: 2, value: (_p, d) => d.lessons },
];
const SLOT_B: QuestDef[] = [
  { id: 'review1', emoji: '🔁', title: 'Проведи одно повторение слов', target: 1, value: (_p, d) => d.reviews },
  { id: 'correct15', emoji: '✅', title: 'Дай 15 верных ответов', target: 15, value: (_p, d) => d.correct },
  { id: 'correct30', emoji: '🎯', title: 'Дай 30 верных ответов', target: 30, value: (_p, d) => d.correct },
];
const SLOT_C: QuestDef[] = [
  { id: 'endless12', emoji: '♾️', title: 'Бесконечный режим: 12 ответов', target: 12, value: (_p, d) => d.endless },
  { id: 'endless24', emoji: '♾️', title: 'Бесконечный режим: 24 ответа', target: 24, value: (_p, d) => d.endless },
  { id: 'goal', emoji: '⚡', title: 'Выполни цель дня по XP', target: 0, value: (p, _d, date) => p.days[date] ?? 0 },
  { id: 'tale1', emoji: '📖', title: 'Дочитай одну сказку', target: 1, value: (_p, d) => d.tales },
  { id: 'gacha3', emoji: '🎰', title: 'Сделай 3 крутки в гаче', target: 3, value: (_p, d) => d.gacha ?? 0 },
];

/** Three quests for the day: the set depends on the date only, so it stays the same all day. */
export function dailyQuests(p: Progress, date: string = dateKey()): Quest[] {
  const h = hashStr(date);
  const defs = [SLOT_A[h % SLOT_A.length], SLOT_B[(h >>> 4) % SLOT_B.length], SLOT_C[(h >>> 8) % SLOT_C.length]];
  const d = todayStats(p, date);
  return defs.map((q) => {
    const target = q.id === 'goal' ? p.settings.dailyGoal : q.target;
    const value = Math.min(target, q.value(p, d, date));
    return { id: q.id, emoji: q.emoji, title: q.title, target, value, done: value >= target };
  });
}

export function questsDone(p: Progress, date: string = dateKey()): boolean {
  return dailyQuests(p, date).every((q) => q.done);
}

/* ------------------------------------------------------------------ word of the day */

export interface DailyWord {
  word: Word;
  lesson: Lesson;
  module: Module;
}

const ALL: DailyWord[] = modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.words.map((word) => ({ word, lesson, module }))));

export function wordOfTheDay(date: string = dateKey()): DailyWord {
  return ALL[hashStr('word:' + date) % ALL.length];
}

/* ------------------------------------------------------------------ misc counters */

export function lessonsDone(p: Progress): number {
  return allLessons.filter((l) => (p.lessons[l.id]?.stars ?? 0) > 0).length;
}

export function perfectLessons(p: Progress): number {
  return allLessons.filter((l) => (p.lessons[l.id]?.stars ?? 0) === 3).length;
}

export function moduleDone(p: Progress, m: Module): boolean {
  return m.lessons.every((l) => (p.lessons[l.id]?.stars ?? 0) > 0);
}

export function sumDaily(p: Progress, key: keyof Omit<DailyStats, 'bonus'>): number {
  return Object.values(p.daily ?? {}).reduce((n, d) => n + (d[key] ?? 0), 0);
}

/** Longest run of consecutive days with any XP. */
export function bestStreak(p: Progress): number {
  const keys = Object.keys(p.days)
    .filter((k) => p.days[k] > 0)
    .sort();
  let best = 0;
  let cur = 0;
  let prev: Date | null = null;
  keys.forEach((k) => {
    const d = new Date(k + 'T00:00:00');
    if (prev && d.getTime() - prev.getTime() === 86_400_000) cur += 1;
    else cur = 1;
    best = Math.max(best, cur);
    prev = d;
  });
  return best;
}
