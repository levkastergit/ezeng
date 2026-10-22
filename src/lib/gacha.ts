import { modules, wordKey } from '../data/course';
import type { Lesson, Module, Word } from '../data/types';
import type { GachaState, Progress, Rarity } from './storage';
import { bumpDaily, emptyGacha } from './storage';
import { initWord } from './srs';
import { hashStr } from './stats';
import { dateKey } from './utils';

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

export function crystalsEarned(p: Progress): number {
  const g = gachaOf(p);
  const achievements = Object.keys(p.achievements ?? {}).length;
  const questDays = Object.values(p.daily ?? {}).filter((d) => d.bonus).length;
  return Math.floor(p.xp / XP_PER_CRYSTAL) + achievements * CRYSTALS_PER_ACHIEVEMENT + questDays * CRYSTALS_PER_QUEST_DAY + g.exchanged;
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

function rollRarity(pity: number, rnd: () => number): Rarity {
  if (pity + 1 >= PITY_LIMIT) return 'legendary';
  const r = rnd() * 100;
  if (r < RARITY.legendary.chance) return 'legendary';
  if (r < RARITY.legendary.chance + RARITY.epic.chance) return 'epic';
  if (r < RARITY.legendary.chance + RARITY.epic.chance + RARITY.rare.chance) return 'rare';
  return 'common';
}

export function pullCost(count: 1 | 10, free: boolean): number {
  if (free) return 0;
  return count === 10 ? PULL10_COST : PULL_COST;
}

/**
 * Performs one or ten pulls. Pure: returns the updated progress and the drawn cards.
 * Returns null when the player cannot afford it.
 */
export function doPull(p: Progress, count: 1 | 10, free: boolean, now: number = Date.now(), rnd: () => number = Math.random): { progress: Progress; results: PullResult[] } | null {
  const cost = pullCost(count, free);
  if (crystalsAvailable(p) < cost) return null;
  const g: GachaState = { ...gachaOf(p), cards: { ...gachaOf(p).cards } };
  const words = { ...p.words };
  const results: PullResult[] = [];
  const rarities: Rarity[] = [];
  for (let i = 0; i < count; i++) {
    const r = rollRarity(g.pity, rnd);
    rarities.push(r);
    g.pity = r === 'legendary' ? 0 : g.pity + 1;
  }
  // A ten-pull always contains at least one epic or legendary card.
  if (count === 10 && !rarities.some((r) => r === 'epic' || r === 'legendary')) rarities[count - 1] = 'epic';
  rarities.forEach((r) => {
    const pool = POOLS[r].length ? POOLS[r] : ALL_CARDS;
    const card = pool[Math.floor(rnd() * pool.length)];
    const prev = g.cards[card.key];
    const isNew = !prev;
    const copies = (prev?.n ?? 0) + 1;
    const shards = isNew ? 0 : RARITY[r].shards;
    g.cards[card.key] = { r, n: copies, at: prev?.at ?? now };
    g.shards += shards;
    if (!words[card.key]) words[card.key] = initWord(card.key, card.lesson.id, card.word.en, now);
    results.push({ card, isNew, copies, shards });
  });
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
