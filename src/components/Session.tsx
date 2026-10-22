import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exercise } from '../lib/exercises';
import type { Settings } from '../lib/storage';
import { pick } from '../lib/utils';
import { stopSpeaking } from '../lib/tts';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { IconCheck, IconClose, IconCross } from './Icons';
import type { ExerciseState } from './exercises/common';
import { WordCard } from './exercises/WordCard';
import { RuleCard } from './exercises/RuleCard';
import { ChoiceExercise } from './exercises/Choice';
import { BuildExercise } from './exercises/Build';
import { TypeExercise } from './exercises/TypeWord';
import { MatchExercise } from './exercises/Match';
import { GapExercise } from './exercises/Gap';

export interface SessionResult {
  correct: number;
  wrong: number;
  total: number;
}

interface Feedback {
  ok: boolean;
  text: string;
  answer?: string;
}

interface Props {
  title: string;
  queue: Exercise[];
  settings: Settings;
  onExit: () => void;
  onFinish: (r: SessionResult) => void;
  onAnswer?: (ex: Exercise, ok: boolean) => void;
  exitConfirm?: string;
}

const PRAISE = ['Отлично!', 'Верно!', 'Так держать!', 'Супер!', 'Правильно!', 'Именно так!'];

export function Session({ title, queue, settings, onExit, onFinish, onAnswer, exitConfirm }: Props) {
  const [items, setItems] = useState<Exercise[]>(queue);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ready, setReady] = useState(false);
  const checkRef = useRef<ExerciseState['check'] | null>(null);
  const stats = useRef({ correct: 0, wrong: 0 });
  const finished = useRef(false);

  const item = items[idx];
  const isCard = item.kind === 'word' || item.kind === 'rule';

  const onState = useCallback((s: ExerciseState) => {
    setReady(s.ready);
    checkRef.current = s.check;
  }, []);

  const applyResult = useCallback(
    (ok: boolean, answer: string) => {
      if (ok) {
        stats.current.correct += 1;
        setFeedback({ ok, text: pick(PRAISE) });
      } else {
        stats.current.wrong += 1;
        setFeedback({
          ok,
          text: item.kind === 'match' ? 'Все пары найдены, но были ошибки.' : 'Не совсем. Правильный ответ:',
          answer: answer || undefined,
        });
        if (!item.retry && item.kind !== 'match') {
          setItems((list) => [...list, { ...item, id: `${item.id}-retry`, retry: true }]);
        }
      }
      onAnswer?.(item, ok);
    },
    [item, onAnswer],
  );

  const next = useCallback(() => {
    stopSpeaking();
    setFeedback(null);
    setReady(false);
    checkRef.current = null;
    if (idx + 1 >= items.length) {
      if (!finished.current) {
        finished.current = true;
        const { correct, wrong } = stats.current;
        onFinish({ correct, wrong, total: correct + wrong });
      }
      return;
    }
    setIdx(idx + 1);
  }, [idx, items.length, onFinish]);

  const primary = useCallback(() => {
    if (feedback || isCard) {
      next();
      return;
    }
    if (!ready || !checkRef.current) return;
    const r = checkRef.current();
    applyResult(r.ok, r.answer);
  }, [feedback, isCard, ready, next, applyResult]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        primary();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [primary]);

  const exit = () => {
    if (!exitConfirm || window.confirm(exitConfirm)) {
      stopSpeaking();
      onExit();
    }
  };

  const label = feedback ? 'Продолжить' : item.kind === 'word' ? 'Дальше' : item.kind === 'rule' ? 'Понятно' : 'Проверить';
  const disabled = feedback !== null;
  const result = feedback ? feedback.ok : null;
  const stepLabel = item.kind === 'word' ? 'Новые слова' : item.kind === 'rule' ? 'Правило' : 'Тренировка';

  let body;
  switch (item.kind) {
    case 'word':
      body = <WordCard word={item.word} settings={settings} />;
      break;
    case 'rule':
      body = <RuleCard rule={item.rule} settings={settings} />;
      break;
    case 'choice':
      body = <ChoiceExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'build':
      body = <BuildExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'type':
      body = <TypeExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'match':
      body = <MatchExercise ex={item} disabled={disabled} settings={settings} onComplete={(ok) => applyResult(ok, '')} />;
      break;
    case 'gap':
      body = <GapExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
  }

  const footerCls = 'session-bottom' + (feedback ? (feedback.ok ? ' ok' : ' bad') : '');

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={exit} aria-label="Выйти">
          <IconClose size={22} />
        </button>
        <ProgressBar value={idx / items.length} className="session-progress" />
        <div className="session-title">
          {title} · {stepLabel}
        </div>
      </header>
      <main className="session-body">
        <div className="session-card" key={item.id}>
          {body}
        </div>
      </main>
      <footer className={footerCls}>
        <div className="session-bottom-inner">
          {feedback ? (
            <div className="feedback">
              <div className="feedback-icon">{feedback.ok ? <IconCheck size={26} /> : <IconCross size={26} />}</div>
              <div className="feedback-text">
                <div className="feedback-title">{feedback.text}</div>
                {feedback.answer && <div className="feedback-answer">{feedback.answer}</div>}
              </div>
            </div>
          ) : (
            <div className="feedback-hint">
              {item.retry
                ? 'Повторная попытка'
                : item.kind === 'match'
                  ? 'Нажми слово слева, затем его перевод справа'
                  : isCard
                    ? ''
                    : 'Enter — проверить'}
            </div>
          )}
          <Button
            size="lg"
            variant={feedback ? (feedback.ok ? 'success' : 'danger') : 'primary'}
            disabled={!feedback && !isCard && !ready}
            onClick={primary}
          >
            {label}
          </Button>
        </div>
      </footer>
    </div>
  );
}
