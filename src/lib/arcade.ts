import type { GachaState, Progress, Rarity, WordState } from './storage';
import { bumpDaily } from './storage';
import { ALL_CARDS, RARITY, beginTx, crystalsAvailable, drawCards, gachaOf, randomRarity } from './gacha';
import type { GachaCard, PullResult } from './gacha';
import { shortRu } from './exercises';
import { dateKey, pick, shuffle } from './utils';

export type Prize =
  | { kind: 'crystals'; n: number }
  | { kind: 'shards'; n: number }
  | { kind: 'boost'; n: number }
  | { kind: 'card'; result: PullResult }
  | { kind: 'nothing' };

type PrizeSpec = { kind: 'crystals'; n: number } | { kind: 'shards'; n: number } | { kind: 'boost'; n: number } | { kind: 'card'; rarity: Rarity } | { kind: 'nothing' };

function realize(g: GachaState, words: Record<string, WordState>, specs: PrizeSpec[], now: number, rnd: () => number): Prize[] {
  return specs.map((s) => {
    switch (s.kind) {
      case 'card':
        return { kind: 'card', result: drawCards(g, words, [s.rarity], now, rnd)[0] };
      case 'crystals':
        g.won += s.n;
        return s;
      case 'shards':
        g.shards += s.n;
        return s;
      case 'boost':
        g.boosts += s.n;
        return s;
      default:
        return s;
    }
  });
}

function between(a: number, b: number, rnd: () => number): number {
  return a + Math.floor(rnd() * (b - a + 1));
}

function atLeast(r: Rarity, min: Rarity): Rarity {
  return RARITY[r].rank < RARITY[min].rank ? min : r;
}

function finish(p: Progress, g: GachaState, words: Record<string, WordState>, now: number): Progress {
  return bumpDaily({ ...p, gacha: g, words }, { games: 1 }, dateKey(new Date(now)));
}

export function prizeLabel(prize: Prize): string {
  switch (prize.kind) {
    case 'crystals':
      return `+${prize.n} 💎`;
    case 'shards':
      return `+${prize.n} 🧩`;
    case 'boost':
      return `Бустер ×2 XP`;
    case 'card':
      return `${RARITY[prize.result.card.rarity].title} карта`;
    default:
      return 'Пусто';
  }
}

/* ------------------------------------------------------------------ chests */

export type ChestTier = 'bronze' | 'silver' | 'gold';

export interface ChestDef {
  title: string;
  cost: number;
  color: string;
  desc: string;
  cards: number;
  minRarity: Rarity;
  guaranteed: Rarity | null;
}

export const CHESTS: Record<ChestTier, ChestDef> = {
  bronze: { title: 'Бронзовый', cost: 3, color: '#c0773c', desc: '2 карты не ниже редкой и небольшой бонус', cards: 2, minRarity: 'rare', guaranteed: null },
  silver: { title: 'Серебряный', cost: 8, color: '#8d9bab', desc: '3 карты, одна точно эпическая, и бонус', cards: 3, minRarity: 'rare', guaranteed: 'epic' },
  gold: { title: 'Золотой', cost: 20, color: '#f2b21c', desc: '4 карты, одна точно легендарная, и крупный бонус', cards: 4, minRarity: 'rare', guaranteed: 'legendary' },
};
export const CHEST_ORDER: ChestTier[] = ['bronze', 'silver', 'gold'];

function chestBonus(tier: ChestTier, rnd: () => number): PrizeSpec {
  const r = rnd();
  if (tier === 'bronze') return r < 0.7 ? { kind: 'shards', n: between(3, 8, rnd) } : { kind: 'crystals', n: between(1, 2, rnd) };
  if (tier === 'silver') {
    if (r < 0.5) return { kind: 'shards', n: between(8, 15, rnd) };
    if (r < 0.8) return { kind: 'crystals', n: between(2, 4, rnd) };
    return { kind: 'boost', n: 1 };
  }
  if (r < 0.4) return { kind: 'crystals', n: between(5, 8, rnd) };
  if (r < 0.75) return { kind: 'boost', n: 1 };
  return { kind: 'shards', n: between(20, 30, rnd) };
}

export function openChest(p: Progress, tier: ChestTier, now: number = Date.now(), rnd: () => number = Math.random): { progress: Progress; prizes: Prize[] } | null {
  const def = CHESTS[tier];
  if (crystalsAvailable(p) < def.cost) return null;
  const { g, words } = beginTx(p);
  const rarities: Rarity[] = [];
  for (let i = 0; i < def.cards; i++) rarities.push(atLeast(randomRarity(rnd), def.minRarity));
  if (def.guaranteed && !rarities.some((r) => RARITY[r].rank >= RARITY[def.guaranteed!].rank)) rarities[0] = def.guaranteed;
  rarities.sort((a, b) => RARITY[b].rank - RARITY[a].rank);
  const specs: PrizeSpec[] = [...rarities.map((rarity) => ({ kind: 'card' as const, rarity })), chestBonus(tier, rnd)];
  g.spent += def.cost;
  g.chests[tier] = (g.chests[tier] ?? 0) + 1;
  const prizes = realize(g, words, specs, now, rnd);
  return { progress: finish(p, g, words, now), prizes };
}

/* ------------------------------------------------------------------ wheel */

export interface WheelSector {
  spec: PrizeSpec;
  label: string;
  weight: number;
  color: string;
}

export const WHEEL_COST = 1;
export const WHEEL: WheelSector[] = [
  { spec: { kind: 'crystals', n: 2 }, label: '+2 💎', weight: 12, color: '#399bff' },
  { spec: { kind: 'shards', n: 5 }, label: '+5 🧩', weight: 12, color: '#45c86f' },
  { spec: { kind: 'card', rarity: 'rare' }, label: 'Редкая', weight: 9, color: '#2a86e8' },
  { spec: { kind: 'nothing' }, label: 'Пусто', weight: 14, color: '#c3c8d0' },
  { spec: { kind: 'crystals', n: 1 }, label: '+1 💎', weight: 14, color: '#399bff' },
  { spec: { kind: 'shards', n: 10 }, label: '+10 🧩', weight: 8, color: '#45c86f' },
  { spec: { kind: 'card', rarity: 'epic' }, label: 'Эпическая', weight: 5, color: '#7b6cf6' },
  { spec: { kind: 'crystals', n: 3 }, label: '+3 💎', weight: 8, color: '#399bff' },
  { spec: { kind: 'nothing' }, label: 'Пусто', weight: 14, color: '#c3c8d0' },
  { spec: { kind: 'shards', n: 20 }, label: '+20 🧩', weight: 4, color: '#45c86f' },
  { spec: { kind: 'crystals', n: 5 }, label: '+5 💎', weight: 3, color: '#ff8a3d' },
  { spec: { kind: 'card', rarity: 'legendary' }, label: 'Легендарная!', weight: 2, color: '#f2b21c' },
];

export function wheelChance(i: number): number {
  const total = WHEEL.reduce((n, s) => n + s.weight, 0);
  return Math.round((WHEEL[i].weight / total) * 1000) / 10;
}

export function freeSpinAvailable(p: Progress, date: string = dateKey()): boolean {
  return gachaOf(p).wheelLastFree !== date;
}

export function spinWheel(p: Progress, free: boolean, now: number = Date.now(), rnd: () => number = Math.random): { progress: Progress; index: number; prize: Prize } | null {
  const cost = free ? 0 : WHEEL_COST;
  if (crystalsAvailable(p) < cost) return null;
  const total = WHEEL.reduce((n, s) => n + s.weight, 0);
  let roll = rnd() * total;
  let index = WHEEL.length - 1;
  for (let i = 0; i < WHEEL.length; i++) {
    roll -= WHEEL[i].weight;
    if (roll < 0) {
      index = i;
      break;
    }
  }
  const { g, words } = beginTx(p);
  g.spent += cost;
  g.wheelSpins += 1;
  if (free) g.wheelLastFree = dateKey(new Date(now));
  const [prize] = realize(g, words, [WHEEL[index].spec], now, rnd);
  return { progress: finish(p, g, words, now), index, prize };
}

/* ------------------------------------------------------------------ slots */

export const SLOT_COST = 1;
export const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
const PLAIN = ['🍒', '🍋', '🔔'];

export interface SlotOutcome {
  reels: [string, string, string];
  title: string;
  prizes: Prize[];
  jackpot: boolean;
}

export const SLOT_TABLE = [
  { title: '7️⃣ 7️⃣ 7️⃣ джекпот', prize: 'легендарная карта + 10 💎', chance: 1 },
  { title: '💎 💎 💎', prize: '+8 💎', chance: 3 },
  { title: '⭐ ⭐ ⭐', prize: 'эпическая карта', chance: 4 },
  { title: 'три одинаковых фрукта или колокольчика', prize: '+4 💎', chance: 7 },
  { title: 'два одинаковых', prize: '+3 🧩', chance: 30 },
];

export function spinSlots(p: Progress, now: number = Date.now(), rnd: () => number = Math.random): { progress: Progress; outcome: SlotOutcome } | null {
  if (crystalsAvailable(p) < SLOT_COST) return null;
  const { g, words } = beginTx(p);
  g.spent += SLOT_COST;
  g.slotSpins += 1;
  const r = rnd() * 100;
  let reels: [string, string, string];
  let specs: PrizeSpec[] = [];
  let title = 'Не повезло';
  let jackpot = false;
  if (r < 1) {
    reels = ['7️⃣', '7️⃣', '7️⃣'];
    specs = [{ kind: 'card', rarity: 'legendary' }, { kind: 'crystals', n: 10 }];
    title = 'ДЖЕКПОТ!';
    jackpot = true;
    g.slotJackpots += 1;
  } else if (r < 4) {
    reels = ['💎', '💎', '💎'];
    specs = [{ kind: 'crystals', n: 8 }];
    title = 'Три кристалла!';
  } else if (r < 8) {
    reels = ['⭐', '⭐', '⭐'];
    specs = [{ kind: 'card', rarity: 'epic' }];
    title = 'Три звезды!';
  } else if (r < 15) {
    const s = pick(PLAIN);
    reels = [s, s, s];
    specs = [{ kind: 'crystals', n: 4 }];
    title = 'Три одинаковых!';
  } else if (r < 45) {
    const s = pick(SLOT_SYMBOLS);
    const other = pick(SLOT_SYMBOLS.filter((x) => x !== s));
    const pos = Math.floor(rnd() * 3);
    reels = [s, s, s];
    reels[pos] = other;
    specs = [{ kind: 'shards', n: 3 }];
    title = 'Пара';
  } else {
    const three = shuffle(SLOT_SYMBOLS).slice(0, 3);
    reels = [three[0], three[1], three[2]];
  }
  const prizes = realize(g, words, specs, now, rnd);
  return { progress: finish(p, g, words, now), outcome: { reels, title, prizes, jackpot } };
}

/* ------------------------------------------------------------------ word bet */

export const BET_STAKES = [1, 2, 5, 10];
export const BET_MAX_MULT = 16;

export interface BetQuestion {
  card: GachaCard;
  options: string[];
  answer: string;
}

/** A word to bet on: usually one the player already owns, sometimes a new one. */
export function betQuestion(p: Progress, rnd: () => number = Math.random): BetQuestion {
  const owned = Object.keys(gachaOf(p).cards)
    .map((k) => ALL_CARDS.find((c) => c.key === k))
    .filter((c): c is GachaCard => !!c);
  const pool = owned.length >= 4 && rnd() < 0.7 ? owned : ALL_CARDS;
  const card = pool[Math.floor(rnd() * pool.length)];
  const answer = shortRu(card.word.ru);
  const others = new Set<string>();
  const candidates = shuffle(ALL_CARDS);
  for (const c of candidates) {
    const ru = shortRu(c.word.ru);
    if (ru !== answer && c.word.en !== card.word.en) others.add(ru);
    if (others.size >= 3) break;
  }
  return { card, options: shuffle([answer, ...others]), answer };
}

export function placeBet(p: Progress, stake: number, now: number = Date.now()): Progress | null {
  if (crystalsAvailable(p) < stake) return null;
  const { g, words } = beginTx(p);
  g.spent += stake;
  g.betPlayed += 1;
  return finish(p, g, words, now);
}

export function settleBet(p: Progress, stake: number, mult: number): Progress {
  const g = { ...gachaOf(p) };
  const pot = stake * mult;
  g.won += pot;
  g.betWon += pot;
  g.betBest = Math.max(g.betBest, mult);
  return { ...p, gacha: g };
}
