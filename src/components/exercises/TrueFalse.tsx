import { useEffect, useState } from 'react';
import type { TrueFalseEx } from '../../lib/exercises';
import { speak } from '../../lib/tts';
import { IconCheck, IconCross, IconSpeaker } from '../Icons';
import type { ExProps } from './common';

export function TrueFalseExercise({ ex, disabled, result, onState, settings }: ExProps<TrueFalseEx>) {
  const [sel, setSel] = useState<boolean | null>(null);

  useEffect(() => {
    onState({
      ready: sel !== null,
      check: () => ({
        ok: sel === ex.isTrue,
        answer: ex.isTrue ? 'Верно' : `Неверно. ${ex.sentence.en} — ${ex.sentence.ru}`,
      }),
    });
  }, [sel, ex, onState]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === '1') setSel(true);
      if (e.key === '2') setSel(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled]);

  const cls = (val: boolean) => {
    let c = 'tf-btn' + (val ? ' yes' : ' no');
    if (sel === val) c += ' selected';
    if (result !== null) {
      if (val === ex.isTrue) c += ' correct';
      else if (sel === val) c += ' wrong';
    }
    return c;
  };

  return (
    <div className="exercise">
      <h2 className="ex-title">Правильный ли перевод?</h2>
      <div className="tf-pair">
        <div className="tf-en">
          <button className="speaker-btn" onClick={() => speak(ex.sentence.en, settings)} aria-label="Прослушать">
            <IconSpeaker size={22} />
          </button>
          <span>{ex.sentence.en}</span>
        </div>
        <div className="tf-arrow">=</div>
        <div className="tf-ru">{ex.shownRu}</div>
      </div>
      <div className="tf-buttons">
        <button className={cls(true)} disabled={disabled} onClick={() => setSel(true)}>
          <IconCheck size={22} /> Верно <span className="option-num">1</span>
        </button>
        <button className={cls(false)} disabled={disabled} onClick={() => setSel(false)}>
          <IconCross size={22} /> Неверно <span className="option-num">2</span>
        </button>
      </div>
    </div>
  );
}
