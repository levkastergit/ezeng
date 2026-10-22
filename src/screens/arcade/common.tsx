import { useEffect, useState } from 'react';
import { SHARDS_PER_CRYSTAL, crystalsAvailable, exchangeShards, gachaOf } from '../../lib/gacha';
import { prizeLabel } from '../../lib/arcade';
import type { Prize } from '../../lib/arcade';
import { useProgress } from '../../lib/progressContext';
import { RevealCard } from '../../components/RevealCard';

/** Compact balance bar shared by the arcade games. */
export function Balance() {
  const { progress, update } = useProgress();
  const g = gachaOf(progress);
  const exchangeable = Math.floor(g.shards / SHARDS_PER_CRYSTAL);
  return (
    <div className="gacha-top compact">
      <div className="gstat crystals">
        <span className="gstat-icon">💎</span>
        <b>{crystalsAvailable(progress)}</b>
      </div>
      <div className="gstat">
        <span className="gstat-icon">🧩</span>
        <b>{g.shards}</b>
        {exchangeable > 0 && (
          <button className="link-btn" onClick={() => update((p) => exchangeShards(p))}>
            обменять на {exchangeable} 💎
          </button>
        )}
      </div>
      <div className="gstat" title="Бустер удваивает XP за следующий урок">
        <span className="gstat-icon">⚡</span>
        <b>{g.boosts}</b>
        <span>{g.boosts === 1 ? 'бустер' : 'бустеров'}</span>
      </div>
    </div>
  );
}

/** Shows prizes: cards flip in one by one, other prizes appear as chips. */
export function PrizeList({ prizes, delayMs = 350 }: { prizes: Prize[]; delayMs?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (!prizes.length) return;
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= prizes.length) window.clearInterval(t);
    }, delayMs);
    return () => window.clearInterval(t);
  }, [prizes, delayMs]);
  const cards = prizes.filter((p) => p.kind === 'card');
  const others = prizes.filter((p) => p.kind !== 'card');
  return (
    <div className="prize-list">
      {cards.length > 0 && (
        <div className="greveal-grid prizes">
          {cards.map((p, i) =>
            p.kind === 'card' ? <RevealCard key={i} result={p.result} open={i < shown} onClick={() => setShown(prizes.length)} /> : null,
          )}
        </div>
      )}
      {others.length > 0 && (
        <div className="prize-chips">
          {others.map((p, i) => (
            <span key={i} className={'prize-chip ' + p.kind + (cards.length + i < shown ? ' on' : '')}>
              {prizeLabel(p)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
