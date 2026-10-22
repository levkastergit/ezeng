import { useEffect, useState } from 'react';
import type { QuizEx } from '../../lib/exercises';
import type { ExProps } from './common';

export function QuizExercise({ ex, disabled, result, onState }: ExProps<QuizEx>) {
  const [sel, setSel] = useState<string | null>(null);
  const { quiz } = ex;

  useEffect(() => {
    onState({ ready: sel !== null, check: () => ({ ok: sel === quiz.answer, answer: quiz.answer }) });
  }, [sel, quiz, onState]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      const n = Number(e.key);
      if (n >= 1 && n <= quiz.options.length) setSel(quiz.options[n - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled, quiz.options]);

  return (
    <div className="exercise">
      <h2 className="ex-title">Вопрос по тексту</h2>
      <div className="quiz-q">{quiz.q}</div>
      <div className="options">
        {quiz.options.map((o, i) => {
          let cls = 'option';
          if (sel === o) cls += ' selected';
          if (result !== null) {
            if (o === quiz.answer) cls += ' correct';
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
    </div>
  );
}
