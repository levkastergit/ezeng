import type { Gap, Lesson, Rule, Sentence, Word } from '../data/types';
import { wordKey } from '../data/course';
import { pick, sample, shuffle, tokenize, uid } from './utils';

export interface Tile {
  id: string;
  text: string;
}

export interface MatchPair {
  key: string;
  en: string;
  ru: string;
}

export interface CheckResult {
  ok: boolean;
  answer: string;
}

interface Base {
  id: string;
  retry?: boolean;
}

export type WordEx = Base & { kind: 'word'; word: Word; lessonId: string };
export type RuleEx = Base & { kind: 'rule'; rule: Rule };
export type ChoiceEx = Base & {
  kind: 'choice';
  dir: 'en-ru' | 'ru-en';
  word: Word;
  wordKey: string;
  options: string[];
  answer: string;
};
export type BuildEx = Base & {
  kind: 'build';
  sentence: Sentence;
  tiles: Tile[];
  answer: string[];
  listen: boolean;
};
export type TypeEx = Base & { kind: 'type'; word: Word; wordKey: string };
export type MatchEx = Base & { kind: 'match'; pairs: MatchPair[] };
export type GapEx = Base & { kind: 'gap'; gap: Gap };

export type Exercise = WordEx | RuleEx | ChoiceEx | BuildEx | TypeEx | MatchEx | GapEx;

/** Short display form of a translation: first meaning, without parenthesised notes. */
export function shortRu(ru: string): string {
  const first = ru.split(';')[0];
  const cleaned = first.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || ru;
}

function ruTokens(ru: string): string[] {
  return shortRu(ru)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Two words conflict when they could both be correct for the same prompt. */
function conflicts(a: Word, b: Word): boolean {
  if (a.en.toLowerCase() === b.en.toLowerCase()) return true;
  const ta = ruTokens(a.ru);
  const tb = ruTokens(b.ru);
  return ta.some((t) => tb.includes(t));
}

function distractors(word: Word, pool: readonly Word[], n: number): Word[] {
  const uniq = new Map<string, Word>();
  pool.forEach((w) => {
    if (!conflicts(w, word) && !uniq.has(w.en.toLowerCase())) uniq.set(w.en.toLowerCase(), w);
  });
  return sample([...uniq.values()], n);
}

export function choiceEx(word: Word, pool: readonly Word[], dir: 'en-ru' | 'ru-en', lessonId: string): ChoiceEx {
  const ds = distractors(word, pool, 3);
  const answer = dir === 'en-ru' ? shortRu(word.ru) : word.en;
  const set = new Set<string>([answer]);
  ds.forEach((d) => set.add(dir === 'en-ru' ? shortRu(d.ru) : d.en));
  return {
    id: uid(),
    kind: 'choice',
    dir,
    word,
    wordKey: wordKey(lessonId, word.en),
    options: shuffle([...set]),
    answer,
  };
}

export function typeEx(word: Word, lessonId: string): TypeEx {
  return { id: uid(), kind: 'type', word, wordKey: wordKey(lessonId, word.en) };
}

export function buildEx(s: Sentence, pool: readonly Sentence[], listen: boolean): BuildEx {
  const answer = tokenize(s.en);
  const lower = new Set(answer.map((a) => a.toLowerCase()));
  const cands = new Map<string, string>();
  pool.forEach((p) => {
    if (p === s) return;
    tokenize(p.en).forEach((t) => {
      const k = t.toLowerCase();
      if (!lower.has(k) && !cands.has(k)) cands.set(k, t);
    });
  });
  const extra = sample([...cands.values()], answer.length <= 3 ? 2 : 3);
  const tiles = shuffle([...answer, ...extra]).map((text) => ({ id: uid(), text }));
  return { id: uid(), kind: 'build', sentence: s, tiles, answer, listen };
}

/** Pick up to n words that do not conflict with each other. */
function nonConflicting(words: readonly Word[], n: number): Word[] {
  const out: Word[] = [];
  for (const w of shuffle(words)) {
    if (out.every((o) => !conflicts(o, w))) out.push(w);
    if (out.length >= n) break;
  }
  return out;
}

export function matchEx(items: readonly { word: Word; lessonId: string }[], n = 5): MatchEx | null {
  const chosen = nonConflicting(
    items.map((i) => i.word),
    n,
  );
  if (chosen.length < 3) return null;
  const pairs = chosen.map((w) => {
    const it = items.find((i) => i.word === w)!;
    return { key: wordKey(it.lessonId, w.en), en: w.en, ru: shortRu(w.ru) };
  });
  return { id: uid(), kind: 'match', pairs };
}

export function buildLessonQueue(lesson: Lesson): Exercise[] {
  const intro: Exercise[] = lesson.words.map((w) => ({ id: uid(), kind: 'word', word: w, lessonId: lesson.id }));
  intro.push({ id: uid(), kind: 'rule', rule: lesson.rule });

  const words = shuffle(lesson.words);
  const recog: Exercise[] = [];
  words.slice(0, 3).forEach((w) => recog.push(choiceEx(w, lesson.words, 'en-ru', lesson.id)));
  words.slice(3, 6).forEach((w) => recog.push(choiceEx(w, lesson.words, 'ru-en', lesson.id)));

  const prod: Exercise[] = [];
  words.slice(-2).forEach((w) => prod.push(typeEx(w, lesson.id)));
  const sents = shuffle(lesson.sentences);
  sents.slice(0, 4).forEach((s) => prod.push(buildEx(s, lesson.sentences, false)));
  sents.slice(4, 6).forEach((s) => prod.push(buildEx(s, lesson.sentences, true)));
  lesson.gaps.forEach((g) => prod.push({ id: uid(), kind: 'gap', gap: g }));

  const match = matchEx(lesson.words.map((word) => ({ word, lessonId: lesson.id })));
  const middle: Exercise[] = match ? [match] : [];

  return [...intro, ...shuffle(recog), ...middle, ...shuffle(prod)];
}

export function buildReviewQueue(
  items: readonly { word: Word; lessonId: string }[],
  pool: readonly Word[],
): Exercise[] {
  const q: Exercise[] = [];
  if (items.length >= 5) {
    const m = matchEx(sample(items, Math.min(items.length, 8)), 5);
    if (m) q.push(m);
  }
  items.forEach((it) => {
    const kind = it.word.en.length > 12 ? pick(['en-ru', 'ru-en'] as const) : pick(['en-ru', 'ru-en', 'type'] as const);
    if (kind === 'type') q.push(typeEx(it.word, it.lessonId));
    else q.push(choiceEx(it.word, pool, kind, it.lessonId));
  });
  return q;
}
