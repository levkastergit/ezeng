import { useId } from 'react';

export type Mood = 'happy' | 'excited' | 'neutral' | 'sad' | 'wink';

export function starPath(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const n = pts.length;
  const mid = (i: number): [number, number] => {
    const a = pts[i % n];
    const b = pts[(i + 1) % n];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  let d = `M ${mid(0)[0].toFixed(2)} ${mid(0)[1].toFixed(2)}`;
  for (let i = 1; i <= n; i++) {
    const c = pts[i % n];
    const m = mid(i);
    d += ` Q ${c[0].toFixed(2)} ${c[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
  }
  return d + ' Z';
}

interface Props {
  size?: number;
  mood?: Mood;
  className?: string;
  /** Show a soft shadow ellipse under the star. */
  shadow?: boolean;
}

export function Mascot({ size = 120, mood = 'happy', className, shadow = true }: Props) {
  const id = useId();
  const g = `g${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const body = starPath(50, 48, 46, 25);
  const eyeY = mood === 'sad' ? 50 : 48;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE26A" />
          <stop offset="1" stopColor="#FFC531" />
        </linearGradient>
      </defs>
      {shadow && <ellipse cx="50" cy="94" rx="26" ry="3.5" fill="#000" opacity="0.08" />}
      <path d={body} fill={`url(#${g})`} stroke="#F2B21C" strokeWidth="1.6" strokeLinejoin="round" />
      {/* eyes */}
      <ellipse cx="40.5" cy={eyeY} rx="6" ry="7" fill="#fff" />
      <ellipse cx="59.5" cy={eyeY} rx="6" ry="7" fill="#fff" />
      {mood === 'wink' ? (
        <path d="M55 48 q4.5 -3 9 0" stroke="#2B2B2B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="42" cy={eyeY + 1} r="3.3" fill="#2B2B2B" />
          <circle cx="61" cy={eyeY + 1} r="3.3" fill="#2B2B2B" />
          <circle cx="43" cy={eyeY - 0.5} r="1.1" fill="#fff" />
          <circle cx="62" cy={eyeY - 0.5} r="1.1" fill="#fff" />
        </>
      )}
      {mood === 'wink' && (
        <>
          <circle cx="42" cy={eyeY + 1} r="3.3" fill="#2B2B2B" />
          <circle cx="43" cy={eyeY - 0.5} r="1.1" fill="#fff" />
        </>
      )}
      {/* eyebrows for sad */}
      {mood === 'sad' && (
        <>
          <path d="M34 39 l10 3" stroke="#D99A12" strokeWidth="2" strokeLinecap="round" />
          <path d="M66 39 l-10 3" stroke="#D99A12" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {/* cheeks */}
      <circle cx="32" cy="58" r="3.6" fill="#FF8C7A" opacity="0.55" />
      <circle cx="68" cy="58" r="3.6" fill="#FF8C7A" opacity="0.55" />
      {/* mouth */}
      {mood === 'happy' && <path d="M42 60 Q50 71 58 60 Q50 64.5 42 60 Z" fill="#2B2B2B" />}
      {mood === 'wink' && <path d="M42 60 Q50 71 58 60 Q50 64.5 42 60 Z" fill="#2B2B2B" />}
      {mood === 'excited' && (
        <>
          <path d="M40 59 Q50 75 60 59 Z" fill="#2B2B2B" />
          <path d="M44.5 66 Q50 72 55.5 66 Q50 69 44.5 66 Z" fill="#FF6B7A" />
        </>
      )}
      {mood === 'neutral' && (
        <path d="M44 62 Q50 66.5 56 62" stroke="#2B2B2B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {mood === 'sad' && (
        <path d="M44 66 Q50 61 56 66" stroke="#2B2B2B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
