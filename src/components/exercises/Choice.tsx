import { useEffect, useState } from 'react';
import type { ChoiceEx } from '../../lib/exercises';
import { shortRu } from '../../lib/exercises';
import { speak } from '../../lib/tts';
import { IconSpeaker } from '../Icons';
import { WordImage } from '../WordImage';
import type { ExProps } from './common';

export function ChoiceExercise({ ex, disabled, result, onState, settings }: ExProps<ChoiceEx>) {
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    onState({ ready: sel !== null, check: () => ({ ok: sel === ex.answer, answer: ex.answer }) });
  }, [sel, ex, onState]);

  useEffect(() => {
    if (ex.dir === 'en-ru' && settings.autoplay && !settings.noAudio) speak(ex.word.en, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      const n = Number(e.key);
      if (n >= 1 && n <= ex.options.length) setSel(ex.options[n - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled, ex.options]);

  const isEn = ex.dir === 'en-ru';

  return (
    <div className="exercise">
      <h2 className="ex-title">{isEn ? 'Выбери правильный перевод' : 'Выбери английское слово'}</h2>
      <div className="prompt-row">
        {isEn ? (
          <button className="speaker-btn" onClick={() => speak(ex.word.en, settings)} aria-label="Прослушать">
            <IconSpeaker size={22} />
          </button>
        ) : (
          <WordImage img={ex.word.img} size={72} fallback="?" />
        )}
        <div className="prompt-word">{isEn ? ex.word.en : shortRu(ex.word.ru)}</div>
        {isEn && (
          <div className="prompt-ipa">
            {ex.word.ipa}
            {ex.word.cy ? ` · ${ex.word.cy}` : ''}
          </div>
        )}
      </div>
      <div className="options">
        {ex.options.map((o, i) => {
          let cls = 'option';
          if (sel === o) cls += ' selected';
          if (result !== null) {
            if (o === ex.answer) cls += ' correct';
            else if (sel === o) cls += ' wrong';
          }
          return (
            <button key={i} className={cls} disabled={disabled} onClick={() => setSel(o)}>
              <span className="option-num">{i + 1}</span>
              <span className="option-text">{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
