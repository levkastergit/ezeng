import manifestJson from '../data/audio-manifest.json';
import { DEFAULT_VOICE, resolveVoice } from './voices';
import type { VoiceDef } from './voices';

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
  /** System voice for texts that have no bundled clip. */
  voiceURI?: string;
  /** Bundled Kokoro voice id (see voices.ts) or 'random'. */
  voice?: string;
}

const BASE_RATE = 0.9;

function clampRate(rate: number | undefined): number {
  const r = rate ?? BASE_RATE;
  return Math.min(1.5, Math.max(0.4, r));
}

function clipUrl(file: string, voice: VoiceDef): string {
  return `${import.meta.env.BASE_URL}audio/${voice.dir ? voice.dir + '/' : ''}${file}`;
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
 * Plays a clip; when the chosen voice has no clip for it (should not happen with a complete bundle),
 * falls back to the default voice. Resolves when playback ends or nothing could be played.
 */
function playClip(file: string, voice: VoiceDef, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(clipUrl(file, voice));
    audio.playbackRate = rate / BASE_RATE;
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    current = audio;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (current === audio) current = null;
      resolve(ok);
    };
    audio.addEventListener('ended', () => finish(true));
    audio.addEventListener('pause', () => finish(true));
    audio.addEventListener('error', () => finish(false));
    audio.play().catch(() => finish(false));
  });
}

async function playWithFallback(text: string, file: string, opts: SpeakOptions, rate: number): Promise<void> {
  const voice = resolveVoice(opts.voice);
  const ok = await playClip(file, voice, rate);
  if (ok) return;
  if (voice.id !== DEFAULT_VOICE.id && (await playClip(file, DEFAULT_VOICE, rate))) return;
  speakWithSystemVoice(text, rate, opts.voiceURI ?? '');
}

/**
 * Plays the bundled clip for the text when one exists (works offline, in the voice chosen in the settings),
 * otherwise falls back to the system speech synthesis with an English voice.
 */
export function speak(text: string, opts: SpeakOptions = {}): void {
  stopSpeaking();
  const rate = clampRate(opts.rate);
  const file = manifest[text] ?? manifest[text.trim()];
  if (file) {
    void playWithFallback(text, file, opts, rate);
    return;
  }
  speakWithSystemVoice(text, rate, opts.voiceURI ?? '');
}

export function hasEnglishVoice(): boolean {
  return getEnglishVoices().length > 0;
}

/** Like speak(), but resolves when playback ends (or immediately when nothing can be played). */
export function speakAsync(text: string, opts: SpeakOptions = {}): Promise<void> {
  stopSpeaking();
  const rate = clampRate(opts.rate);
  const file = manifest[text] ?? manifest[text.trim()];
  if (file) {
    return (async () => {
      const voice = resolveVoice(opts.voice);
      if (await playClip(file, voice, rate)) return;
      if (voice.id !== DEFAULT_VOICE.id && (await playClip(file, DEFAULT_VOICE, rate))) return;
      await speakSystemAsync(text, rate, opts.voiceURI ?? '');
    })();
  }
  return speakSystemAsync(text, rate, opts.voiceURI ?? '');
}

function speakSystemAsync(text: string, rate: number, voiceURI: string): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsAvailable()) return resolve();
    const v = pickVoice(voiceURI);
    if (!v) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate;
    u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export function stopSpeaking(): void {
  if (current) {
    current.pause();
    current = null;
  }
  if (ttsAvailable()) window.speechSynthesis.cancel();
}
