import { useEffect, useRef, useState } from 'react';
import { SLOT_COST, SLOT_SYMBOLS, SLOT_TABLE, spinSlots } from '../../lib/arcade';
import type { SlotOutcome } from '../../lib/arcade';
import { crystalsAvailable, gachaOf } from '../../lib/gacha';
import { useProgress } from '../../lib/progressContext';
import { playSfx } from '../../lib/sfx';
import { Button } from '../../components/Button';
import { Balance, PrizeList } from './common';

const STOP_MS = [900, 1500, 2100];

export function SlotsPanel() {
  const { progress, update } = useProgress();
  const crystals = crystalsAvailable(progress);
  const [reels, setReels] = useState<string[]>(['🍒', '⭐', '💎']);
  const [running, setRunning] = useState<boolean[]>([false, false, false]);
  const [outcome, setOutcome] = useState<SlotOutcome | null>(null);
  const [done, setDone] = useState(true);
  const timers = useRef<number[]>([]);
  /** Mirrors `running` synchronously so a cycling tick never overwrites a reel that has just stopped. */
  const runningRef = useRef<boolean[]>([false, false, false]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // While a reel runs, cycle its symbol quickly.
  useEffect(() => {
    if (!running.some(Boolean)) return;
    const t = window.setInterval(() => {
      setReels((r) => r.map((s, i) => (runningRef.current[i] ? SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(s) + 1 + Math.floor(Math.random() * 2)) % SLOT_SYMBOLS.length] : s)));
    }, 70);
    return () => window.clearInterval(t);
  }, [running]);

  const spin = () => {
    if (!done) return;
    const r = spinSlots(progress);
    if (!r) return;
    update(() => r.progress);
    setOutcome(null);
    setDone(false);
    runningRef.current = [true, true, true];
    setRunning([true, true, true]);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = STOP_MS.map((ms, i) =>
      window.setTimeout(() => {
        runningRef.current = runningRef.current.map((v, k) => (k === i ? false : v));
        setRunning((run) => run.map((v, k) => (k === i ? false : v)));
        setReels((cur) => cur.map((s, k) => (k === i ? r.outcome.reels[i] : s)));
        if (i === 2) {
          setOutcome(r.outcome);
          setDone(true);
          if (progress.settings.sounds) playSfx(r.outcome.jackpot || r.outcome.prizes.some((p) => p.kind === 'card') ? 'level' : r.outcome.prizes.length ? 'ok' : 'bad');
        }
      }, ms),
    );
  };

  return (
    <div className="arcade-panel">
      <Balance />
      <div className="slots-layout">
        <div className="slot-machine">
          <div className="slot-reels">
            {reels.map((s, i) => (
              <div key={i} className={'slot-reel' + (running[i] ? ' run' : '') + (outcome && done && !running[i] && outcome.prizes.length ? ' win' : '')}>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div className={'slot-title' + (outcome?.jackpot ? ' jackpot' : '')}>{outcome ? outcome.title : done ? 'Нажмите «Крутить»' : '…'}</div>
          <Button size="lg" onClick={spin} disabled={!done || crystals < SLOT_COST}>
            Крутить · {SLOT_COST} 💎
          </Button>
          {outcome && done && outcome.prizes.length > 0 && <PrizeList prizes={outcome.prizes} />}
        </div>
        <div className="wheel-side">
          <h3>Слоты</h3>
          <p className="muted">Три барабана, одна крутка за {SLOT_COST} 💎. Выигрыш зависит от комбинации.</p>
          <table className="rates-table">
            <tbody>
              {SLOT_TABLE.map((row) => (
                <tr key={row.title}>
                  <td>{row.title}</td>
                  <td>{row.prize}</td>
                  <td>{row.chance} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted small">
            Круток: {gachaOf(progress).slotSpins} · джекпотов: {gachaOf(progress).slotJackpots}
          </div>
        </div>
      </div>
    </div>
  );
}
