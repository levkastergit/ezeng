import { grammarBank, readingBank, vocabBank, LEVEL_NAMES } from '../data/test';
import type { GrammarItem, ReadingItem, VocabItem } from '../data/test';
import { pick, shuffle } from './utils';

export interface VocabQuestion {
  item: VocabItem;
  options: string[];
}

export interface Answered {
  lv: number;
  ok: boolean;
}

export const VOCAB_COUNT = 20;
export const GRAMMAR_COUNT = 12;
export const READING_COUNT = 3;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function firstWord(ru: string) {
  return ru.split(/[ ,(]/)[0].toLowerCase();
}

/** Picks an unused vocabulary item at (or nearest to) the wanted level and builds 4 options. */
export function nextVocab(level: number, used: Set<string>): VocabQuestion | null {
  for (const delta of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
    const lv = level + delta;
    if (lv < 1 || lv > 5) continue;
    const pool = vocabBank.filter((v) => v.lv === lv && !used.has(v.en));
    if (pool.length === 0) continue;
    const item = pick(pool);
    const distractorPool = vocabBank.filter(
      (v) => v.en !== item.en && Math.abs(v.lv - item.lv) <= 1 && firstWord(v.ru) !== firstWord(item.ru),
    );
    const distractors = shuffle(distractorPool).slice(0, 3).map((v) => v.ru);
    return { item, options: shuffle([item.ru, ...distractors]) };
  }
  return null;
}

/** Options are shuffled on every presentation so the position never gives the answer away. */
export function nextGrammar(level: number, used: Set<string>): GrammarItem | null {
  for (const delta of [0, 1, -1, 2, -2, 3, -3]) {
    const lv = level + delta;
    if (lv < 1 || lv > 4) continue;
    const pool = grammarBank.filter((g) => g.lv === lv && !used.has(g.text));
    if (pool.length > 0) {
      const g = pick(pool);
      return { ...g, options: shuffle(g.options) };
    }
  }
  return null;
}

export function nextReading(level: number, used: Set<string>): ReadingItem | null {
  for (const delta of [0, 1, -1, 2, -2, 3, -3]) {
    const lv = level + delta;
    if (lv < 1 || lv > 4) continue;
    const pool = readingBank.filter((r) => r.lv === lv && !used.has(r.id));
    if (pool.length > 0) {
      const r = pick(pool);
      return { ...r, questions: r.questions.map((q) => ({ ...q, options: shuffle(q.options) })) };
    }
  }
  return null;
}

/** Staircase: a correct answer moves one band up, a wrong one moves one band down. */
export function stepLevel(level: number, ok: boolean, max: number): number {
  return clamp(ok ? level + 1 : level - 1, 1, max);
}

/** Mean of (level if correct, level - 1 if wrong) → ability index on the bank's scale. */
export function abilityIndex(answers: Answered[]): number {
  if (answers.length === 0) return 0;
  const sum = answers.reduce((s, a) => s + (a.ok ? a.lv : a.lv - 1), 0);
  return sum / answers.length;
}

export interface ReadingOutcome {
  lv: number;
  correct: number;
  total: number;
}

export function readingIndex(outcomes: ReadingOutcome[]): number {
  if (outcomes.length === 0) return 0;
  const sum = outcomes.reduce((s, o) => s + (o.lv - 1 + o.correct / o.total), 0);
  return sum / outcomes.length;
}

export interface PlacementSummary {
  /** 0..5 ability index on a common scale. */
  score: number;
  level: string;
  vocab: number;
  grammar: number;
  reading: number;
}

export function levelName(index: number): string {
  if (index < 1.2) return 'A1';
  if (index < 2.2) return 'A2';
  if (index < 3.2) return 'B1';
  if (index < 4.2) return 'B2';
  return 'C1';
}

export function summarize(vocab: Answered[], grammar: Answered[], reading: ReadingOutcome[]): PlacementSummary {
  const v = abilityIndex(vocab); // 0..5 (A1..C1)
  const g = abilityIndex(grammar); // 0..4 (the grammar bank tops out at B2)
  const r = readingIndex(reading); // 0..4
  // Combine on the common 0..5 scale; section labels keep their own scale so grammar/reading never show C1.
  const score = 0.45 * v + 0.25 * ((g / 4) * 5) + 0.3 * ((r / 4) * 5);
  return { score, level: levelName(score), vocab: v, grammar: g, reading: r };
}

export const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: 'Начальный уровень: вы понимаете простые фразы и знакомые слова. Самое время пройти основной курс целиком.',
  A2: 'Базовый уровень: вы справляетесь с бытовыми темами и короткими текстами. Укрепляйте грамматику и расширяйте словарь.',
  B1: 'Средний уровень: вы понимаете основной смысл текстов и можете поддержать разговор. Добавляйте сложную лексику и читайте больше.',
  B2: 'Выше среднего: вы свободно читаете и улавливаете нюансы. Работайте над редкой лексикой и стилем.',
  C1: 'Продвинутый уровень: вы уверенно владеете языком, включая сложную лексику.',
};

export { LEVEL_NAMES };
