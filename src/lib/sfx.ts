/** Tiny synthesized sound effects (no audio files needed). */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.02);
}

export function playSfx(kind: 'ok' | 'bad' | 'level'): void {
  const c = audio();
  if (!c) return;
  if (kind === 'ok') {
    tone(c, 660, 0, 0.12, 'sine', 0.12);
    tone(c, 880, 0.1, 0.18, 'sine', 0.12);
  } else if (kind === 'bad') {
    tone(c, 220, 0, 0.18, 'triangle', 0.1);
    tone(c, 180, 0.12, 0.22, 'triangle', 0.08);
  } else {
    tone(c, 523, 0, 0.12, 'sine', 0.1);
    tone(c, 659, 0.12, 0.12, 'sine', 0.1);
    tone(c, 784, 0.24, 0.12, 'sine', 0.1);
    tone(c, 1047, 0.36, 0.3, 'sine', 0.12);
  }
}
