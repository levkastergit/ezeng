/** Karaoke: synced lyrics (LRC), word timings and helpers shared by the built-in songs and the user's own songs. */

export interface KWord {
  w: string;
  /** Start and end, seconds of lyric time. */
  s: number;
  e: number;
}

export interface KLine {
  /** Index in the source line list (for translations and editing). */
  i: number;
  text: string;
  ru?: string;
  /** Start / end of the line, NaN when the line has no timing. */
  t: number;
  e: number;
  timed: boolean;
  words: KWord[];
}

/** A line of a user song as stored in the progress. `t` is null until the line is synced. */
export interface UserKaraokeLine {
  t: number | null;
  text: string;
  ru?: string;
  /** Per-word start times from an enhanced LRC file, when available. */
  w?: number[];
}

export interface UserKaraokeSong {
  id: string;
  title: string;
  artist: string;
  /** Length of the audio file, seconds. */
  duration?: number;
  lines: UserKaraokeLine[];
  /** Seconds added to every lyric time to match this audio file (intro length differences). */
  offset: number;
  source: 'lrclib' | 'lrc' | 'manual';
  lrclibId?: number;
  createdAt: number;
}

/* ------------------------------------------------------------------ LRC */

const TIME_RE = /\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g;
const WORD_TIME_RE = /<(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)>/g;

function toSec(min: string, sec: string): number {
  return Number(min) * 60 + Number(sec.replace(':', '.'));
}

export function hasLrcTimes(text: string): boolean {
  return /\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/.test(text);
}

/** Parses LRC (line timestamps, several stamps per line, [offset:], enhanced <mm:ss.xx> word stamps). */
export function parseLrc(text: string): UserKaraokeLine[] {
  let offset = 0;
  const out: UserKaraokeLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const off = /^\[offset:\s*([+-]?\d+)\s*\]/i.exec(raw.trim());
    if (off) {
      offset = Number(off[1]) / 1000;
      continue;
    }
    const stamps: number[] = [];
    let rest = raw;
    TIME_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TIME_RE.exec(raw))) stamps.push(toSec(m[1], m[2]));
    if (!stamps.length) continue; // metadata tags like [ar:], [ti:] or plain text
    rest = raw.replace(TIME_RE, '');
    const wordTimes: number[] = [];
    WORD_TIME_RE.lastIndex = 0;
    const pieces = rest.split(WORD_TIME_RE);
    // split() with two capture groups yields: text, min, sec, text, min, sec, text...
    let clean = '';
    if (pieces.length > 1) {
      for (let k = 0; k < pieces.length; k += 3) {
        const chunk = pieces[k];
        if (k > 0) {
          const t = toSec(pieces[k - 2], pieces[k - 1]);
          if (chunk.trim()) wordTimes.push(t);
        }
        clean += chunk;
      }
    } else {
      clean = rest;
    }
    const lineText = clean.replace(/\s+/g, ' ').trim();
    const words = lineText ? lineText.split(' ') : [];
    stamps.forEach((t) => {
      out.push({
        t: Math.max(0, t - offset),
        text: lineText,
        w: wordTimes.length === words.length && words.length > 0 ? wordTimes.map((x) => Math.max(0, x - offset)) : undefined,
      });
    });
  }
  return out.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
}

/** Plain lyrics: one line per text line, no timings (blank lines become breaks). */
export function parsePlain(text: string): UserKaraokeLine[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim());
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.map((l) => ({ t: null, text: l }));
}

/** Puts translations (one per non-empty lyric line, in order) onto the lines. */
export function attachTranslation(lines: UserKaraokeLine[], translation: string): UserKaraokeLine[] {
  const ru = translation
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let k = 0;
  return lines.map((l) => (l.text ? { ...l, ru: ru[k++] || l.ru } : l));
}

export function toLrc(song: UserKaraokeSong): string {
  const stamp = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `[${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`;
  };
  return [`[ar:${song.artist}]`, `[ti:${song.title}]`, ...song.lines.filter((l) => l.t !== null).map((l) => `${stamp(l.t!)}${l.text}`)].join('\n');
}

/* ------------------------------------------------------------------ word timings */

/** Rough syllable count used to share a line's time between its words. Works for Latin and Cyrillic. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-zа-яё']/g, '');
  if (!w) return 1;
  const groups = w.match(/[aeiouyаеёиоуыэюя]+/g)?.length ?? 1;
  const silentE = /[^aeiou]e$/.test(w) && groups > 1 ? 1 : 0;
  return Math.max(1, groups - silentE);
}

const SEC_PER_SYLLABLE = 0.32;

/** Builds timed lines for a user song: interpolates word times inside each line by syllables. */
export function buildUserTimeline(lines: UserKaraokeLine[], duration?: number): KLine[] {
  const out: KLine[] = [];
  lines.forEach((l, i) => {
    if (!l.text) return;
    const words = l.text.split(' ');
    if (l.t === null) {
      out.push({ i, text: l.text, ru: l.ru, t: NaN, e: NaN, timed: false, words: words.map((w) => ({ w, s: NaN, e: NaN })) });
      return;
    }
    const next = lines.slice(i + 1).find((x) => x.t !== null);
    const nextT = next?.t ?? duration ?? l.t + 6;
    const syl = words.map(syllables);
    const natural = syl.reduce((a, b) => a + b, 0) * SEC_PER_SYLLABLE + 0.4;
    const end = Math.max(l.t + 0.5, Math.min(nextT - 0.08, l.t + Math.max(1.5, natural * 1.5)));
    let ws: KWord[];
    if (l.w && l.w.length === words.length) {
      ws = words.map((w, k) => ({ w, s: l.w![k], e: k + 1 < words.length ? l.w![k + 1] : end }));
    } else {
      const total = syl.reduce((a, b) => a + b, 0);
      let acc = l.t;
      ws = words.map((w, k) => {
        const len = ((end - l.t!) * syl[k]) / total;
        const word = { w, s: acc, e: acc + len };
        acc += len;
        return word;
      });
    }
    out.push({ i, text: l.text, ru: l.ru, t: l.t, e: end, timed: true, words: ws });
  });
  return out;
}

/** Built-in songs: word times come from the offline alignment (scripts/align-songs.py). */
export function buildBuiltinTimeline(lines: { en: string; ru: string }[], timing: Record<string, [number, number][]>): KLine[] {
  const out: KLine[] = [];
  lines.forEach((l, i) => {
    if (!l.en) return;
    const words = l.en.split(/\s+/);
    const tw = timing[String(i)];
    if (tw && tw.length === words.length) {
      out.push({ i, text: l.en, ru: l.ru, t: tw[0][0], e: tw[tw.length - 1][1], timed: true, words: words.map((w, k) => ({ w, s: tw[k][0], e: tw[k][1] })) });
    } else {
      out.push({ i, text: l.en, ru: l.ru, t: NaN, e: NaN, timed: false, words: words.map((w) => ({ w, s: NaN, e: NaN })) });
    }
  });
  return out;
}

/** Index in `lines` of the line being sung at `time` (last timed line that has started), or -1. */
export function activeLine(lines: KLine[], time: number): number {
  let found = -1;
  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    if (!l.timed) continue;
    if (l.t <= time) found = k;
    else break;
  }
  return found;
}

/* ------------------------------------------------------------------ files */

/** "01. Artist - Title (Official Video).mp3" → { artist, title } */
export function guessFromFileName(name: string): { artist: string; title: string } {
  let base = name.replace(/\.[a-z0-9]{2,5}$/i, '');
  base = base.replace(/[_]+/g, ' ');
  base = base.replace(/\s*[[(][^\])]*(official|video|audio|lyrics?|clip|hd|remaster|radio edit|mp3)[^\])]*[\])]\s*/gi, ' ');
  base = base.replace(/^\s*\d{1,3}\s*[.\-)]\s*/, '');
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  return { artist: '', title: base.trim() };
}

export function audioExt(name: string): string | null {
  const ext = /\.([a-z0-9]{2,5})$/i.exec(name)?.[1]?.toLowerCase() ?? '';
  return /^(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/.test(ext) ? ext : null;
}

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ bridge */

export interface LyricsResult {
  id: number;
  artist: string;
  title: string;
  album?: string;
  duration?: number;
  synced: string | null;
  plain: string | null;
  instrumental: boolean;
}

interface KaraokeBridge {
  save(id: string, ext: string, data: ArrayBuffer): Promise<{ ok: boolean; file?: string; error?: string }>;
  file(id: string): Promise<string | null>;
  remove(id: string): Promise<boolean>;
  searchLyrics(q: { artist?: string; title?: string; q?: string }): Promise<{ ok: boolean; results?: LyricsResult[]; error?: string }>;
}

export function karaokeBridge(): KaraokeBridge | null {
  return (window as unknown as { ezeng?: { karaoke?: KaraokeBridge } }).ezeng?.karaoke ?? null;
}

export function userMediaUrl(file: string): string {
  return `${import.meta.env.BASE_URL}user-media/${file}`;
}
