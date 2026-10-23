import { modules, wordKey } from '../data/course';
import type { Lesson, Module, Word } from '../data/types';
import type { GachaState, Progress, Rarity, WordState } from './storage';
import { bumpDaily, emptyGacha } from './storage';
import { initWord } from './srs';
import { hashStr, levelFor, sumDaily } from './stats';
import { addDays, dateKey } from './utils';

export const RARITY: Record<Rarity, { title: string; short: string; color: string; chance: number; shards: number; rank: number }> = {
  common: { title: 'Обычная', short: 'обычная', color: '#8f98a3', chance: 60, shards: 1, rank: 0 },
  rare: { title: 'Редкая', short: 'редкая', color: '#399bff', chance: 27, shards: 3, rank: 1 },
  epic: { title: 'Эпическая', short: 'эпическая', color: '#7b6cf6', chance: 10, shards: 10, rank: 2 },
  legendary: { title: 'Легендарная', short: 'легендарная', color: '#f2b21c', chance: 3, shards: 30, rank: 3 },
};
export const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common'];

export const PULL_COST = 1;
export const PULL10_COST = 9;
/** A legendary card is guaranteed after this many pulls without one. */
export const PITY_LIMIT = 60;
export const SHARDS_PER_CRYSTAL = 10;
export const XP_PER_CRYSTAL = 5;
export const CRYSTALS_PER_ACHIEVEMENT = 3;
export const CRYSTALS_PER_QUEST_DAY = 2;

export interface GachaCard {
  key: string;
  word: Word;
  lesson: Lesson;
  module: Module;
  rarity: Rarity;
}

/** Fixed rarity per word, derived from a hash so that it is the same on every computer. */
export function rarityOf(key: string): Rarity {
  const h = hashStr('gacha:' + key) % 1000;
  if (h < 30) return 'legendary';
  if (h < 130) return 'epic';
  if (h < 400) return 'rare';
  return 'common';
}

export const ALL_CARDS: GachaCard[] = modules.flatMap((module) =>
  module.lessons.flatMap((lesson) =>
    lesson.words.map((word) => {
      const key = wordKey(lesson.id, word.en);
      return { key, word, lesson, module, rarity: rarityOf(key) };
    }),
  ),
);

export const POOLS: Record<Rarity, GachaCard[]> = {
  common: ALL_CARDS.filter((c) => c.rarity === 'common'),
  rare: ALL_CARDS.filter((c) => c.rarity === 'rare'),
  epic: ALL_CARDS.filter((c) => c.rarity === 'epic'),
  legendary: ALL_CARDS.filter((c) => c.rarity === 'legendary'),
};

export const CARD_BY_KEY = new Map(ALL_CARDS.map((c) => [c.key, c]));

export function gachaOf(p: Progress): GachaState {
  return p.gacha ?? emptyGacha();
}

export const CRYSTALS_PER_LESSON = 2;
export const CRYSTALS_PER_REVIEW = 1;
export const ENDLESS_ANSWERS_PER_CRYSTAL = 12;
export const CRYSTALS_PER_TALE = 2;
export const CRYSTALS_PER_TEST = 3;
export const CRYSTALS_PER_LEVEL = 5;
/** Daily login reward by consecutive day (cycles every week). */
export const LOGIN_REWARDS = [1, 1, 2, 2, 3, 3, 5];

export interface LoginInfo {
  /** Consecutive login day (1 = first day of a streak). */
  day: number;
  /** Crystals for today's login (already granted when `today` is true). */
  reward: number;
  /** Crystals granted by all logins so far. */
  total: number;
  today: boolean;
}

function nextDayKey(key: string): string {
  return dateKey(addDays(new Date(key + 'T00:00:00'), 1));
}

export function loginInfo(p: Progress, date: string = dateKey()): LoginInfo {
  const dates = [...new Set(p.logins ?? [])].sort();
  let total = 0;
  let day = 0;
  let prev: string | null = null;
  let todayReward = 0;
  let today = false;
  for (const d of dates) {
    day = prev && nextDayKey(prev) === d ? day + 1 : 1;
    const r = LOGIN_REWARDS[(day - 1) % LOGIN_REWARDS.length];
    total += r;
    prev = d;
    if (d === date) {
      todayReward = r;
      today = true;
    }
  }
  if (today) return { day, reward: todayReward, total, today: true };
  const nextDay = prev && nextDayKey(prev) === date ? day + 1 : 1;
  return { day: nextDay, reward: LOGIN_REWARDS[(nextDay - 1) % LOGIN_REWARDS.length], total, today: false };
}

export interface CrystalSource {
  label: string;
  n: number;
}

/** Every way crystals are earned, derived from the progress so that the balance matches on all devices. */
export function crystalSources(p: Progress): CrystalSource[] {
  const g = gachaOf(p);
  const achievements = Object.keys(p.achievements ?? {}).length;
  const questDays = Object.values(p.daily ?? {}).filter((d) => d.bonus).length;
  return [
    { label: `Опыт: 1 за каждые ${XP_PER_CRYSTAL} XP`, n: Math.floor(p.xp / XP_PER_CRYSTAL) },
    { label: `Пройденные уроки: +${CRYSTALS_PER_LESSON}`, n: sumDaily(p, 'lessons') * CRYSTALS_PER_LESSON },
    { label: `Повторения слов: +${CRYSTALS_PER_REVIEW}`, n: sumDaily(p, 'reviews') * CRYSTALS_PER_REVIEW },
    { label: `Бесконечный режим: +1 за ${ENDLESS_ANSWERS_PER_CRYSTAL} ответов`, n: Math.floor((p.endlessAnswers ?? 0) / ENDLESS_ANSWERS_PER_CRYSTAL) },
    { label: `Прочитанные сказки: +${CRYSTALS_PER_TALE}`, n: p.talesDone.length * CRYSTALS_PER_TALE },
    { label: `Тесты уровня: +${CRYSTALS_PER_TEST}`, n: p.tests.length * CRYSTALS_PER_TEST },
    { label: `Новые уровни: +${CRYSTALS_PER_LEVEL}`, n: (levelFor(p.xp).level - 1) * CRYSTALS_PER_LEVEL },
    { label: `Достижения: +${CRYSTALS_PER_ACHIEVEMENT}`, n: achievements * CRYSTALS_PER_ACHIEVEMENT },
    { label: `Задания дня: +${CRYSTALS_PER_QUEST_DAY}`, n: questDays * CRYSTALS_PER_QUEST_DAY },
    { label: 'Ежедневный вход: 1–5 по серии дней', n: loginInfo(p).total },
    { label: 'Выигрыши в играх', n: g.won },
    { label: 'Обмен осколков', n: g.exchanged },
  ];
}

export function crystalsEarned(p: Progress): number {
  return crystalSources(p).reduce((n, s) => n + s.n, 0);
}

export function crystalsAvailable(p: Progress): number {
  return Math.max(0, crystalsEarned(p) - gachaOf(p).spent);
}

export function freePullAvailable(p: Progress, date: string = dateKey()): boolean {
  return gachaOf(p).lastFree !== date;
}

export function collectedCount(p: Progress): number {
  return Object.keys(gachaOf(p).cards).length;
}

export function collectedByRarity(p: Progress): Record<Rarity, number> {
  const out: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  Object.values(gachaOf(p).cards).forEach((c) => {
    out[c.r] += 1;
  });
  return out;
}

/** Modules whose every word has been collected. */
export function completedModules(p: Progress): Module[] {
  const cards = gachaOf(p).cards;
  return modules.filter((m) => m.lessons.every((l) => l.words.every((w) => cards[wordKey(l.id, w.en)])));
}

export interface PullResult {
  card: GachaCard;
  isNew: boolean;
  /** Copies owned after this pull. */
  copies: number;
  shards: number;
}

/** Random rarity by the banner chances (no pity). */
export function randomRarity(rnd: () => number = Math.random): Rarity {
  const r = rnd() * 100;
  if (r < RARITY.legendary.chance) return 'legendary';
  if (r < RARITY.legendary.chance + RARITY.epic.chance) return 'epic';
  if (r < RARITY.legendary.chance + RARITY.epic.chance + RARITY.rare.chance) return 'rare';
  return 'common';
}

function rollRarity(pity: number, rnd: () => number): Rarity {
  if (pity + 1 >= PITY_LIMIT) return 'legendary';
  return randomRarity(rnd);
}

export function pullCost(count: 1 | 10, free: boolean): number {
  if (free) return 0;
  return count === 10 ? PULL10_COST : PULL_COST;
}

/**
 * Adds one random card of each requested rarity to the collection (duplicates give shards)
 * and puts new words into the dictionary. Shared by the gacha and the arcade prizes.
 */
export function drawCards(g: GachaState, words: Record<string, WordState>, rarities: Rarity[], now: number, rnd: () => number = Math.random): PullResult[] {
  return rarities.map((r) => {
    const pool = POOLS[r].length ? POOLS[r] : ALL_CARDS;
    const card = pool[Math.floor(rnd() * pool.length)];
    const prev = g.cards[card.key];
    const isNew = !prev;
    const copies = (prev?.n ?? 0) + 1;
    const shards = isNew ? 0 : RARITY[r].shards;
    g.cards[card.key] = { r, n: copies, at: prev?.at ?? now };
    g.shards += shards;
    if (!words[card.key]) words[card.key] = initWord(card.key, card.lesson.id, card.word.en, now);
    return { card, isNew, copies, shards };
  });
}

/** Mutable working copy of the gacha state and the dictionary for one transaction. */
export function beginTx(p: Progress): { g: GachaState; words: Record<string, WordState> } {
  return { g: { ...gachaOf(p), cards: { ...gachaOf(p).cards }, chests: { ...gachaOf(p).chests } }, words: { ...p.words } };
}

/**
 * Performs one or ten pulls. Pure: returns the updated progress and the drawn cards.
 * Returns null when the player cannot afford it.
 */
export function doPull(p: Progress, count: 1 | 10, free: boolean, now: number = Date.now(), rnd: () => number = Math.random): { progress: Progress; results: PullResult[] } | null {
  const cost = pullCost(count, free);
  if (crystalsAvailable(p) < cost) return null;
  const { g, words } = beginTx(p);
  const rarities: Rarity[] = [];
  for (let i = 0; i < count; i++) {
    const r = rollRarity(g.pity, rnd);
    rarities.push(r);
    g.pity = r === 'legendary' ? 0 : g.pity + 1;
  }
  // A ten-pull always contains at least one epic or legendary card.
  if (count === 10 && !rarities.some((r) => r === 'epic' || r === 'legendary')) rarities[count - 1] = 'epic';
  const results = drawCards(g, words, rarities, now, rnd);
  g.pulls += count;
  g.spent += cost;
  if (free) g.lastFree = dateKey(new Date(now));
  const progress = bumpDaily({ ...p, gacha: g, words }, { gacha: count }, dateKey(new Date(now)));
  return { progress, results };
}

/** Converts shards into crystals. */
export function exchangeShards(p: Progress): Progress {
  const g = gachaOf(p);
  const crystals = Math.floor(g.shards / SHARDS_PER_CRYSTAL);
  if (crystals <= 0) return p;
  return { ...p, gacha: { ...g, shards: g.shards - crystals * SHARDS_PER_CRYSTAL, exchanged: g.exchanged + crystals } };
}
