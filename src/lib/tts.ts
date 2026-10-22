import manifestJson from '../data/audio-manifest.json';

/** Pre-recorded clips for every English word and sentence in the course (text → file name). */
const manifest = manifestJson as Record<string, string>;

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();
let current: HTMLAudioElement | null = null;

function refresh() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices();
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refresh();
  window.speechSynthesis.addEventListener('voiceschanged', refresh);
}

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (voices.length === 0) refresh();
  return voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
}

export function onVoicesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function hasClip(text: string): boolean {
  return Boolean(manifest[text] ?? manifest[text.trim()]);
}

function pickVoice(voiceURI: string): SpeechSynthesisVoice | null {
  const en = getEnglishVoices();
  if (voiceURI) {
    const v = en.find((x) => x.voiceURI === voiceURI);
    if (v) return v;
  }
  const us = en.filter((v) => v.lang.toLowerCase() === 'en-us');
  const preferred = [...us, ...en].find((v) => /natural|zira|aria|jenny|guy/i.test(v.name));
  return preferred ?? us[0] ?? en[0] ?? null;
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string;
}

const BASE_RATE = 0.9;

function clampRate(rate: number | undefined): number {
  const r = rate ?? BASE_RATE;
  return Math.min(1.5, Math.max(0.4, r));
}

function speakWithSystemVoice(text: string, rate: number, voiceURI: string): void {
  if (!ttsAvailable()) return;
  const v = pickVoice(voiceURI);
  if (!v) return; // no English voice installed: stay silent rather than mispronounce
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  u.pitch = 1;
  u.voice = v;
  synth.speak(u);
}

/**
 * Plays the bundled clip for the text when one exists (works offline, same voice for everyone),
 * otherwise falls back to the system speech synthesis with an English voice.
 */
export function speak(text: string, opts: SpeakOptions = {}): void {
  stopSpeaking();
  const rate = clampRate(opts.rate);
  const file = manifest[text] ?? manifest[text.trim()];
  if (file) {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    audio.playbackRate = rate / BASE_RATE;
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    current = audio;
    audio.play().catch(() => speakWithSystemVoice(text, rate, opts.voiceURI ?? ''));
    return;
  }
  speakWithSystemVoice(text, rate, opts.voiceURI ?? '');
}

export function stopSpeaking(): void {
  if (current) {
    current.pause();
    current = null;
  }
  if (ttsAvailable()) window.speechSynthesis.cancel();
}
