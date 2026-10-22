import { useEffect, useRef, useState } from 'react';
import type { MatchEx } from '../../lib/exercises';
import type { Settings } from '../../lib/storage';
import { shuffle } from '../../lib/utils';
import { speak } from '../../lib/tts';

interface Props {
  ex: MatchEx;
  disabled: boolean;
  settings: Settings;
  onComplete: (ok: boolean) => void;
}

export function MatchExercise({ ex, disabled, settings, onComplete }: Props) {
  const [left] = useState(() => shuffle(ex.pairs));
  const [right] = useState(() => shuffle(ex.pairs));
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [shake, setShake] = useState<Set<string>>(() => new Set());
  const mistakes = useRef(0);
  const completed = useRef(false);

  useEffect(() => {
    if (!selL || !selR) return;
    if (selL === selR) {
      const d = new Set(done);
      d.add(selL);
      setDone(d);
      setSelL(null);
      setSelR(null);
      if (d.size === ex.pairs.length && !completed.current) {
        completed.current = true;
        setTimeout(() => onComplete(mistakes.current === 0), 350);
      }
    } else {
      mistakes.current += 1;
      setShake(new Set([selL, selR]));
      const t = setTimeout(() => {
        setShake(new Set());
        setSelL(null);
        setSelR(null);
      }, 550);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selL, selR]);

  const cls = (key: string, selected: boolean) => {
    let c = 'match-item';
    if (done.has(key)) c += ' done';
    if (selected) c += ' selected';
    if (shake.has(key)) c += ' wrong';
    return c;
  };

  return (
    <div className="exercise">
      <h2 className="ex-title">Соедини пары</h2>
      <div className="match-grid">
        <div className="match-col">
          {left.map((p) => (
            <button
              key={p.key}
              className={cls(p.key, selL === p.key)}
              disabled={disabled || done.has(p.key) || shake.size > 0}
              onClick={() => {
                setSelL(p.key);
                speak(p.en, settings);
              }}
            >
              {p.en}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((p) => (
            <button
              key={p.key}
              className={cls(p.key, selR === p.key)}
              disabled={disabled || done.has(p.key) || shake.size > 0}
              onClick={() => setSelR(p.key)}
            >
              {p.ru}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
