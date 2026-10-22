import { useEffect, useMemo, useRef, useState } from 'react';
import { modules } from '../data/course';
import { buildEndlessBatch } from '../lib/exercises';
import type { Exercise } from '../lib/exercises';
import { useProgress } from '../lib/progressContext';
import { bumpDaily } from '../lib/storage';
import { dateKey } from '../lib/utils';
import { Session } from '../components/Session';
import type { SessionResult } from '../components/Session';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { IconBolt, IconFlame } from '../components/Icons';

interface Props {
  moduleId: string;
  onExit: () => void;
}

const BATCH = 12;

/** Endless drills over one module: batches of mixed tasks, XP after every batch, stop whenever you like. */
export function EndlessScreen({ moduleId, onExit }: Props) {
  const { progress, update } = useProgress();
  const module = useMemo(() => modules.find((m) => m.id === moduleId), [moduleId]);
  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<Exercise[]>(() => (module ? buildEndlessBatch(module, BATCH) : []));
  const [totals, setTotals] = useState({ correct: 0, wrong: 0, xp: 0 });
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [summary, setSummary] = useState(false);
  const streakRef = useRef(0);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  if (!module) return null;

  const onAnswer = (_ex: Exercise, ok: boolean) => {
    if (ok) {
      const s = streakRef.current + 1;
      setStreak(s);
      setBest((b) => Math.max(b, s));
    } else {
      setStreak(0);
    }
  };

  const onFinish = (r: SessionResult) => {
    const xp = r.correct;
    setTotals((t) => ({ correct: t.correct + r.correct, wrong: t.wrong + r.wrong, xp: t.xp + xp }));
    update((p) => {
      const dk = dateKey();
      const bestStreak = Math.max(p.endlessBest ?? 0, Math.max(best, streakRef.current));
      return bumpDaily(
        { ...p, xp: p.xp + xp, days: { ...p.days, [dk]: (p.days[dk] ?? 0) + xp }, endlessBest: bestStreak, endlessAnswers: (p.endlessAnswers ?? 0) + r.total },
        { endless: r.total, correct: r.correct },
      );
    });
    setQueue(buildEndlessBatch(module, BATCH));
    setRound((n) => n + 1);
  };

  const finish = () => {
    update((p) => ({ ...p, endlessBest: Math.max(p.endlessBest ?? 0, best) }));
    setSummary(true);
  };

  if (summary) {
    return (
      <div className="result-screen">
        <div className="result-card">
          <Mascot size={150} mood={totals.correct >= 10 ? 'excited' : 'happy'} />
          <h1>Бесконечный режим</h1>
          <p className="result-sub">{module.title}</p>
          <div className="result-stats">
            <div className="result-stat">
              <b>{totals.correct}</b>
              <span>верных</span>
            </div>
            <div className="result-stat">
              <b>{best}</b>
              <span>лучшая серия</span>
            </div>
            <div className="result-stat">
              <b>+{totals.xp}</b>
              <span>XP</span>
            </div>
          </div>
          <Button size="lg" onClick={onExit}>
            Готово
          </Button>
        </div>
      </div>
    );
  }

  const header = (
    <div className="endless-stats">
      <span title="Серия верных ответов">
        <IconFlame size={16} className="c-orange" /> {streak}
      </span>
      <span title="Верных всего">
        <IconBolt size={16} className="c-yellow" /> {totals.correct}
      </span>
      <button className="link-btn" onClick={finish}>
        Закончить
      </button>
    </div>
  );

  return (
    <Session
      key={round}
      title={`∞ ${module.title}`}
      queue={queue}
      settings={progress.settings}
      onExit={finish}
      onFinish={onFinish}
      onAnswer={onAnswer}
      onToggleTurbo={(on) => update((p) => ({ ...p, settings: { ...p.settings, turbo: on } }))}
      headerExtra={header}
      noProgress
    />
  );
}
