import { useEffect, useState } from 'react';
import type { ListenChoiceEx } from '../../lib/exercises';
import { shortRu } from '../../lib/exercises';
import { speak } from '../../lib/tts';
import { IconSpeaker } from '../Icons';
import type { ExProps } from './common';

/** Hear a word and pick its spelling. In no-audio mode the Russian meaning is shown instead. */
export function ListenChoiceExercise({ ex, disabled, result, onState, settings }: ExProps<ListenChoiceEx>) {
  const [sel, setSel] = useState<string | null>(null);
  const silent = settings.noAudio;

  useEffect(() => {
    onState({ ready: sel !== null, check: () => ({ ok: sel === ex.answer, answer: ex.answer }) });
  }, [sel, ex, onState]);

  useEffect(() => {
    if (!silent && settings.autoplay) speak(ex.word.en, settings);
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

  return (
    <div className="exercise">
      <h2 className="ex-title">{silent ? 'Какое слово это значит?' : 'Какое слово ты слышишь?'}</h2>
      {silent ? (
        <div className="prompt-row">
          <div className="prompt-word">{shortRu(ex.word.ru)}</div>
        </div>
      ) : (
        <div className="listen-box">
          <button className="speaker-btn big" onClick={() => speak(ex.word.en, settings)} aria-label="Прослушать">
            <IconSpeaker size={34} />
          </button>
          <button className="link-btn" onClick={() => speak(ex.word.en, { ...settings, rate: settings.rate * 0.6 })}>
            Медленнее
          </button>
        </div>
      )}
      <div className="options">
        {ex.options.map((o, i) => {
          let cls = 'option';
          if (sel === o) cls += ' selected';
          if (result !== null) {
            if (o === ex.answer) cls += ' correct';
            else if (sel === o) cls += ' wrong';
          }
          return (
            <button key={o} className={cls} disabled={disabled} onClick={() => setSel(o)}>
              <span className="option-num">{i + 1}</span>
              <span className="option-text">{o}</span>
            </button>
          );
        })}
      </div>
      {result !== null && <div className="ru-hint">{ex.word.en} — {ex.word.ru}</div>}
    </div>
  );
}
