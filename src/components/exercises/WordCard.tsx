import { useEffect } from 'react';
import type { Word } from '../../data/types';
import type { Settings } from '../../lib/storage';
import { speak } from '../../lib/tts';
import { IconSpeaker } from '../Icons';
import { WordImage } from '../WordImage';

export function WordCard({ word, settings }: { word: Word; settings: Settings }) {
  useEffect(() => {
    if (settings.autoplay) speak(word.en, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.en]);

  return (
    <div className="exercise word-card">
      <div className="pill pill-purple">Новое слово</div>
      <div className="word-main">
        <WordImage img={word.img} size={140} className="word-card-img" fallback={word.en.slice(0, 1).toUpperCase()} />
        <div className="word-line">
          <button className="speaker-btn" onClick={() => speak(word.en, settings)} aria-label="Прослушать">
            <IconSpeaker size={22} />
          </button>
          <div className="word-en">{word.en}</div>
        </div>
        <div className="word-ipa">
          {word.ipa}
          {word.cy && <span className="word-cy">{word.cy}</span>}
        </div>
        <div className="word-ru">{word.ru}</div>
      </div>
      <button className="word-example" onClick={() => speak(word.ex, settings)}>
        <IconSpeaker size={18} className="c-blue" />
        <div>
          <div className="ex-en">{word.ex}</div>
          <div className="ex-ru">{word.exRu}</div>
        </div>
      </button>
    </div>
  );
}
