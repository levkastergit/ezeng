/** Bundled Kokoro voices: every course text has a clip for each of them under public/audio/<dir>/. */
export interface VoiceDef {
  id: string;
  name: string;
  desc: string;
  /** Sub-folder of public/audio ('' = the original voice at the root). */
  dir: string;
  gender: 'f' | 'm';
  accent: 'us' | 'uk';
}

export const VOICES: VoiceDef[] = [
  { id: 'af_heart', name: 'Heart', desc: 'американский английский, женский голос', dir: '', gender: 'f', accent: 'us' },
  { id: 'am_michael', name: 'Michael', desc: 'американский английский, мужской голос', dir: 'am_michael', gender: 'm', accent: 'us' },
  { id: 'bf_emma', name: 'Emma', desc: 'британский английский, женский голос', dir: 'bf_emma', gender: 'f', accent: 'uk' },
  { id: 'bm_george', name: 'George', desc: 'британский английский, мужской голос', dir: 'bm_george', gender: 'm', accent: 'uk' },
];

export const DEFAULT_VOICE = VOICES[0];
/** Setting value meaning "a random voice for every clip". */
export const RANDOM_VOICE = 'random';

export function voiceById(id: string | undefined): VoiceDef | null {
  return VOICES.find((v) => v.id === id) ?? null;
}

/** Resolves a settings value ('random' included) to a concrete voice. */
export function resolveVoice(id: string | undefined): VoiceDef {
  if (id === RANDOM_VOICE) return VOICES[Math.floor(Math.random() * VOICES.length)];
  return voiceById(id) ?? DEFAULT_VOICE;
}

/** The other speaker in a dialogue: opposite gender, same accent. */
export function partnerVoice(v: VoiceDef): VoiceDef {
  return VOICES.find((x) => x.accent === v.accent && x.gender !== v.gender) ?? VOICES.find((x) => x.gender !== v.gender) ?? v;
}
