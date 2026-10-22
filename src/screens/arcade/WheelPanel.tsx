import { useState } from 'react';
import { WHEEL, WHEEL_COST, freeSpinAvailable, prizeLabel, spinWheel, wheelChance } from '../../lib/arcade';
import type { Prize } from '../../lib/arcade';
import { crystalsAvailable, gachaOf } from '../../lib/gacha';
import { useProgress } from '../../lib/progressContext';
import { playSfx } from '../../lib/sfx';
import { Button } from '../../components/Button';
import { Balance, PrizeList } from './common';

const R = 150;
const CX = 160;
const CY = 160;
const SPIN_MS = 4200;

function polar(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function sectorPath(i: number): string {
  const a0 = i * 30;
  const a1 = a0 + 30;
  const [x0, y0] = polar(a0, R);
  const [x1, y1] = polar(a1, R);
  return `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
}

const norm = (x: number) => ((x % 360) + 360) % 360;

export function WheelPanel() {
  const { progress, update } = useProgress();
  const crystals = crystalsAvailable(progress);
  const free = freeSpinAvailable(progress);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ index: number; prize: Prize } | null>(null);

  const spin = (useFree: boolean) => {
    if (spinning) return;
    const r = spinWheel(progress, useFree);
    if (!r) return;
    update(() => r.progress);
    setResult(null);
    setSpinning(true);
    const target = -(r.index * 30 + 15);
    let delta = norm(target - norm(angle));
    if (delta < 30) delta += 360;
    setAngle(angle + 5 * 360 + delta);
    window.setTimeout(() => {
      setSpinning(false);
      setResult({ index: r.index, prize: r.prize });
      if (progress.settings.sounds) playSfx(r.prize.kind === 'nothing' ? 'bad' : r.prize.kind === 'card' ? 'level' : 'ok');
    }, SPIN_MS);
  };

  return (
    <div className="arcade-panel">
      <Balance />
      <div className="wheel-layout">
        <div className="wheel-box">
          <div className="wheel-pointer" />
          <svg viewBox="0 0 320 320" className="wheel" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.7, 0.1, 1)` : 'none' }}>
            {WHEEL.map((s, i) => (
              <path key={i} d={sectorPath(i)} fill={s.color} stroke="#fff" strokeWidth="2" />
            ))}
            {WHEEL.map((s, i) => {
              const [x, y] = polar(i * 30 + 15, 100);
              return (
                <text key={i} x={x} y={y} fontSize="12" fontWeight="700" fill={s.spec.kind === 'nothing' ? '#555' : '#fff'} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * 30 + 15} ${x} ${y})`}>
                  {s.label}
                </text>
              );
            })}
            <circle cx={CX} cy={CY} r="26" fill="#fff" stroke="#e6e8ec" strokeWidth="3" />
            <text x={CX} y={CY + 7} fontSize="20" textAnchor="middle">
              ✦
            </text>
          </svg>
        </div>
        <div className="wheel-side">
          <h3>Колесо фортуны</h3>
          <p className="muted">Одна бесплатная прокрутка в день, дальше по {WHEEL_COST} 💎. Сектора выпадают с разной вероятностью.</p>
          <div className="btn-row left">
            {free && (
              <Button size="lg" className="btn-free" onClick={() => spin(true)} disabled={spinning}>
                Бесплатная прокрутка
              </Button>
            )}
            <Button size="lg" onClick={() => spin(false)} disabled={spinning || crystals < WHEEL_COST}>
              Крутить · {WHEEL_COST} 💎
            </Button>
          </div>
          {result && (
            <div className="wheel-result">
              <div className="wheel-result-title">{result.prize.kind === 'nothing' ? 'Пусто, в другой раз!' : `Выпало: ${prizeLabel(result.prize)}`}</div>
              {result.prize.kind === 'card' && <PrizeList prizes={[result.prize]} />}
            </div>
          )}
          <table className="rates-table">
            <tbody>
              {WHEEL.map((s, i) => (
                <tr key={i}>
                  <td>
                    <i className="dot" style={{ background: s.color }} /> {s.label}
                  </td>
                  <td>{wheelChance(i)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted small">Прокруток всего: {gachaOf(progress).wheelSpins}</div>
        </div>
      </div>
    </div>
  );
}
