import { useEffect, useMemo, useState } from 'react';
import type { GapEx } from '../../lib/exercises';
import { shuffle } from '../../lib/utils';
import type { ExProps } from './common';

export function GapExercise({ ex, disabled, result, onState }: ExProps<GapEx>) {
  const [sel, setSel] = useState<string | null>(null);
  const options = useMemo(() => shuffle(ex.gap.options), [ex.gap]);

  useEffect(() => {
    onState({ ready: sel !== null, check: () => ({ ok: sel === ex.gap.answer, answer: ex.gap.text.replace('___', ex.gap.answer) }) });
  }, [sel, ex, onState]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) setSel(options[n - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled, options]);

  const [before, after] = ex.gap.text.split('___');
  const blankCls = 'gap-blank' + (sel ? ' filled' : '') + (result === null ? '' : result ? ' ok' : ' bad');

  return (
    <div className="exercise">
      <h2 className="ex-title">Заполни пропуск</h2>
      <div className="gap-sentence">
        <span>{before}</span>
        <span className={blankCls}>{sel ?? ''}</span>
        <span>{after}</span>
      </div>
      <div className="gap-ru">{ex.gap.ru}</div>
      <div className="chips">
        {options.map((o, i) => {
          let cls = 'chip';
          if (sel === o) cls += ' selected';
          if (result !== null) {
            if (o === ex.gap.answer) cls += ' correct';
            else if (sel === o) cls += ' wrong';
          }
          return (
            <button key={o} className={cls} disabled={disabled} onClick={() => setSel(o)}>
              <span className="option-num">{i + 1}</span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
