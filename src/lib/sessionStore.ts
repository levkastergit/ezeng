import type { Exercise } from './exercises';

/** A lesson in progress, kept so that leaving the lesson does not lose the work done. */
export interface SavedSession {
  lessonId: string;
  items: Exercise[];
  idx: number;
  correct: number;
  wrong: number;
  skipped: number;
  savedAt: number;
}

import { getStorageScope } from './storage';

const KEY = () => `ezeng.session.${getStorageScope()}`;

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY());
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedSession;
    if (!s || !Array.isArray(s.items) || typeof s.idx !== 'number' || s.idx >= s.items.length) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: SavedSession): void {
  try {
    localStorage.setItem(KEY(), JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY());
  } catch {
    // ignore
  }
}
