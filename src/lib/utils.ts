export const DAY = 86_400_000;

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;
export function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Lower-case, strip punctuation and extra spaces for lenient comparison. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[.,!?;:"«»()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a sentence into word tiles, dropping surrounding punctuation. */
export function tokenize(s: string): string[] {
  return s
    .split(/\s+/)
    .map((t) => t.replace(/^[.,!?;:"«»()]+|[.,!?;:"«»()]+$/g, ''))
    .filter(Boolean);
}

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function formatDue(due: number, now: number = Date.now()): string {
  const diff = due - now;
  if (diff <= 0) return 'пора повторить';
  const h = Math.max(1, Math.round(diff / 3_600_000));
  if (h < 24) return `через ${h} ${plural(h, 'час', 'часа', 'часов')}`;
  const d = Math.max(1, Math.round(diff / DAY));
  return `через ${d} ${plural(d, 'день', 'дня', 'дней')}`;
}

export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
