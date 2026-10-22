import type { CSSProperties } from 'react';
import { RARITY } from '../lib/gacha';
import type { PullResult } from '../lib/gacha';
import { WordImage } from './WordImage';

interface Props {
  result: PullResult;
  open: boolean;
  onClick?: () => void;
}

/** A gacha card that flips from its back to the word when `open` becomes true. */
export function RevealCard({ result, open, onClick }: Props) {
  const { card } = result;
  return (
    <button className={`gcard ${card.rarity}${open ? ' open' : ''}`} style={{ '--rc': RARITY[card.rarity].color } as CSSProperties} onClick={onClick}>
      <div className="gcard-inner">
        <div className="gcard-front">
          <span>✦</span>
        </div>
        <div className="gcard-back">
          <div className="grarity-tag">{RARITY[card.rarity].title}</div>
          <WordImage img={card.word.img} size={64} fallback={card.word.en[0]?.toUpperCase()} />
          <div className="gcard-en">{card.word.en}</div>
          {card.word.cy && <div className="gcard-cy">{card.word.cy}</div>}
          <div className="gcard-ru">{card.word.ru}</div>
          {result.isNew ? <span className="gcard-new">новая</span> : <span className="gcard-dupe">×{result.copies} · +{result.shards} 🧩</span>}
        </div>
      </div>
    </button>
  );
}
