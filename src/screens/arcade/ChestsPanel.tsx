import { useState } from 'react';
import type { CSSProperties } from 'react';
import { CHESTS, CHEST_ORDER, openChest } from '../../lib/arcade';
import type { ChestTier, Prize } from '../../lib/arcade';
import { crystalsAvailable, gachaOf } from '../../lib/gacha';
import { useProgress } from '../../lib/progressContext';
import { playSfx } from '../../lib/sfx';
import { Button } from '../../components/Button';
import { Balance, PrizeList } from './common';

export function ChestsPanel() {
  const { progress, update } = useProgress();
  const crystals = crystalsAvailable(progress);
  const opened = gachaOf(progress).chests;
  const [state, setState] = useState<{ tier: ChestTier; prizes: Prize[]; phase: 'shaking' | 'open' } | null>(null);

  const open = (tier: ChestTier) => {
    const r = openChest(progress, tier);
    if (!r) return;
    update(() => r.progress);
    setState({ tier, prizes: r.prizes, phase: 'shaking' });
    window.setTimeout(() => {
      setState((s) => (s ? { ...s, phase: 'open' } : s));
      if (progress.settings.sounds) playSfx(r.prizes.some((p) => p.kind === 'card' && p.result.card.rarity === 'legendary') ? 'level' : 'ok');
    }, 900);
  };

  return (
    <div className="arcade-panel">
      <Balance />
      <p className="muted arcade-intro">Сундук всегда содержит карты не ниже редкой и один бонус: осколки, кристаллы или бустер ×2 XP на следующий урок.</p>
      {state ? (
        <section className="chest-open">
          <div className={'chest-big ' + state.phase} style={{ '--rc': CHESTS[state.tier].color } as CSSProperties}>
            <span>{state.phase === 'open' ? '🎉' : '🧰'}</span>
          </div>
          {state.phase === 'open' && (
            <>
              <h3>{CHESTS[state.tier].title} сундук открыт</h3>
              <PrizeList prizes={state.prizes} />
              <div className="btn-row">
                <Button variant="secondary" onClick={() => setState(null)}>
                  К сундукам
                </Button>
                <Button onClick={() => open(state.tier)} disabled={crystals < CHESTS[state.tier].cost}>
                  Ещё один · {CHESTS[state.tier].cost} 💎
                </Button>
              </div>
            </>
          )}
        </section>
      ) : (
        <div className="chest-grid">
          {CHEST_ORDER.map((tier) => {
            const def = CHESTS[tier];
            return (
              <div key={tier} className="chest-card" style={{ '--rc': def.color } as CSSProperties}>
                <div className="chest-emoji">🧰</div>
                <h3>{def.title}</h3>
                <p className="muted">{def.desc}</p>
                <div className="chest-meta">открыто: {opened[tier] ?? 0}</div>
                <Button size="lg" onClick={() => open(tier)} disabled={crystals < def.cost}>
                  Открыть · {def.cost} 💎
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
