import { useEffect, useState } from 'react';
import type { TypeEx } from '../../lib/exercises';
import { shortRu } from '../../lib/exercises';
import { normalize } from '../../lib/utils';
import type { ExProps } from './common';

export function TypeExercise({ ex, disabled, result, onState }: ExProps<TypeEx>) {
  const [val, setVal] = useState('');

  useEffect(() => {
    onState({
      ready: val.trim().length > 0,
      check: () => ({ ok: normalize(val) === normalize(ex.word.en), answer: ex.word.en }),
    });
  }, [val, ex, onState]);

  const cls = 'type-input' + (result === null ? '' : result ? ' ok' : ' bad');

  return (
    <div className="exercise">
      <h2 className="ex-title">Напиши по-английски</h2>
      <div className="prompt-row">
        <div className="prompt-word">{shortRu(ex.word.ru)}</div>
      </div>
      <div className="type-hint">{ex.word.exRu}</div>
      <input
        className={cls}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={disabled}
        placeholder="Введи слово…"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        lang="en"
      />
    </div>
  );
}
