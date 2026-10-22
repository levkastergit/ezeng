import type { WordState } from './storage';
import { DAY, addDays, dateKey } from './utils';

/** A word introduced in a lesson is due for its first review tomorrow. */
export function initWord(key: string, lessonId: string, en: string, now: number): WordState {
  return {
    key,
    lessonId,
    en,
    reps: 0,
    interval: 1,
    ease: 2.5,
    due: now + DAY,
    learnedAt: now,
    correct: 0,
    wrong: 0,
  };
}

/** Simplified SM-2: correct answers stretch the interval, mistakes reset it. */
export function reviewWord(w: WordState, ok: boolean, now: number): WordState {
  if (ok) {
    const reps = w.reps + 1;
    const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(w.interval * w.ease));
    return {
      ...w,
      reps,
      interval,
      ease: Math.min(3, w.ease + 0.05),
      due: now + interval * DAY,
      correct: w.correct + 1,
    };
  }
  return {
    ...w,
    reps: 0,
    interval: 1,
    ease: Math.max(1.3, w.ease - 0.2),
    due: now + 10 * 60_000,
    wrong: w.wrong + 1,
  };
}

export function dueWords(words: Record<string, WordState>, now: number): WordState[] {
  return Object.values(words)
    .filter((w) => w.due <= now)
    .sort((a, b) => a.due - b.due);
}

export function nextDue(words: Record<string, WordState>): number | null {
  const list = Object.values(words);
  if (list.length === 0) return null;
  return Math.min(...list.map((w) => w.due));
}

/** Consecutive days (ending today or yesterday) with any XP earned. */
export function streakDays(days: Record<string, number>): number {
  let d = new Date();
  if (!(days[dateKey(d)] > 0)) d = addDays(d, -1);
  let n = 0;
  while (days[dateKey(d)] > 0) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}
