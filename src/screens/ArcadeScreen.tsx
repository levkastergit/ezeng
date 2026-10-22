import { useState } from 'react';
import { GachaScreen } from './GachaScreen';
import { ChestsPanel } from './arcade/ChestsPanel';
import { WheelPanel } from './arcade/WheelPanel';
import { SlotsPanel } from './arcade/SlotsPanel';
import { BetPanel } from './arcade/BetPanel';

type Tab = 'gacha' | 'chests' | 'wheel' | 'slots' | 'bet';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'gacha', label: 'Гача', emoji: '🃏' },
  { id: 'chests', label: 'Сундуки', emoji: '🧰' },
  { id: 'wheel', label: 'Колесо', emoji: '🎡' },
  { id: 'slots', label: 'Слоты', emoji: '🎰' },
  { id: 'bet', label: 'Ставка на слово', emoji: '🎲' },
];

/** Gacha and the arcade games share one tab in the sidebar; all of them spend the same crystals. */
export function ArcadeScreen() {
  const [tab, setTab] = useState<Tab>('gacha');
  return (
    <div className="arcade">
      <div className="arcade-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'arcade-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)} data-tab={t.id}>
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>
      {tab === 'gacha' && <GachaScreen />}
      {tab === 'chests' && (
        <div className="page">
          <div className="page-head">
            <h1>Сундуки</h1>
            <p>Лутбоксы трёх уровней: чем дороже, тем выше гарантированная редкость.</p>
          </div>
          <ChestsPanel />
        </div>
      )}
      {tab === 'wheel' && (
        <div className="page">
          <div className="page-head">
            <h1>Колесо фортуны</h1>
            <p>Крутите и забирайте, что выпало: кристаллы, осколки или карту.</p>
          </div>
          <WheelPanel />
        </div>
      )}
      {tab === 'slots' && (
        <div className="page">
          <div className="page-head">
            <h1>Слоты</h1>
            <p>Три барабана, редкие комбинации и джекпот с легендарной картой.</p>
          </div>
          <SlotsPanel />
        </div>
      )}
      {tab === 'bet' && (
        <div className="page">
          <div className="page-head">
            <h1>Ставка на слово</h1>
            <p>Единственная игра, где всё решает знание: угадайте перевод и удвойте ставку.</p>
          </div>
          <BetPanel />
        </div>
      )}
    </div>
  );
}
