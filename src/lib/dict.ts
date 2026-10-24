import { allLessons, wordKey } from '../data/course';
import type { Word } from '../data/types';

export interface DictHit {
  word: Word;
  lessonId: string;
  key: string;
}

const index = new Map<string, DictHit>();
allLessons.forEach((lesson) =>
  lesson.words.forEach((word) => {
    const k = word.en.toLowerCase();
    if (!index.has(k)) index.set(k, { word, lessonId: lesson.id, key: wordKey(lesson.id, word.en) });
  }),
);

const IRREGULAR: Record<string, string> = {
  was: 'be', were: 'be', is: 'be', am: 'be', are: 'be', been: 'be',
  went: 'go', gone: 'go', saw: 'see', seen: 'see', came: 'come', ate: 'eat', took: 'take',
  made: 'make', got: 'get', had: 'have', has: 'have', did: 'do', does: 'do', said: 'say',
  felt: 'feel', held: 'hold', ran: 'run', broke: 'break', flew: 'fly', sang: 'sing', sung: 'sing',
  gonna: 'going to', wanna: 'want', gotta: 'got to', 'cause': 'because', cos: 'because',
  me: 'me', my: 'my', i: 'I',
};

/** Looks up a word from free text (song lyrics) in the course dictionary, trying simple English endings. */
export function lookupWord(raw: string): DictHit | null {
  const w = raw.toLowerCase().replace(/[’`]/g, "'").replace(/^[^a-z']+|[^a-z']+$/g, '');
  if (!w) return null;
  const tries = [w, IRREGULAR[w] ?? ''];
  const base = w.replace(/'s$|'re$|'ll$|'ve$|'m$|'d$|n't$/, '');
  tries.push(base);
  if (base.endsWith('ies')) tries.push(base.slice(0, -3) + 'y');
  if (base.endsWith('es')) tries.push(base.slice(0, -2));
  if (base.endsWith('s')) tries.push(base.slice(0, -1));
  if (base.endsWith('ied')) tries.push(base.slice(0, -3) + 'y');
  if (base.endsWith('ed')) tries.push(base.slice(0, -2), base.slice(0, -1));
  if (base.endsWith('ing')) tries.push(base.slice(0, -3), base.slice(0, -3) + 'e');
  if (base.endsWith('in')) tries.push(base + 'g');
  if (/(.)\1(ed|ing)$/.test(base)) tries.push(base.replace(/(.)\1(ed|ing)$/, '$1'));
  for (const t of tries) {
    const hit = t ? index.get(t.toLowerCase()) : undefined;
    if (hit) return hit;
  }
  return null;
}
