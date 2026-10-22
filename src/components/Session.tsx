import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Exercise } from '../lib/exercises';
import { CARD_KINDS } from '../lib/exercises';
import type { Settings } from '../lib/storage';
import { pick } from '../lib/utils';
import { stopSpeaking } from '../lib/tts';
import { playSfx } from '../lib/sfx';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { IconBolt, IconCheck, IconClose, IconCross } from './Icons';
import type { ExerciseState } from './exercises/common';
import { WordCard } from './exercises/WordCard';
import { RuleCard } from './exercises/RuleCard';
import { DialogueCard } from './exercises/DialogueCard';
import { ReadingCard } from './exercises/ReadingCard';
import { ChoiceExercise } from './exercises/Choice';
import { ListenChoiceExercise } from './exercises/ListenChoice';
import { BuildExercise } from './exercises/Build';
import { TypeExercise } from './exercises/TypeWord';
import { MatchExercise } from './exercises/Match';
import { GapExercise } from './exercises/Gap';
import { TrueFalseExercise } from './exercises/TrueFalse';
import { QuizExercise } from './exercises/Quiz';

export interface SessionResult {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

export interface SessionSnapshot {
  items: Exercise[];
  idx: number;
  correct: number;
  wrong: number;
  skipped: number;
}

interface Feedback {
  kind: 'ok' | 'bad' | 'skip';
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
  /** Called after every step so the caller can persist the session. */
  onSnapshot?: (s: SessionSnapshot) => void;
  onToggleTurbo?: (on: boolean) => void;
  initial?: SessionSnapshot;
  exitConfirm?: string;
  /** Extra content for the header, e.g. endless-mode counters. */
  headerExtra?: ReactNode;
  /** Hide the progress bar (endless mode). */
  noProgress?: boolean;
}

const PRAISE = ['Отлично!', 'Верно!', 'Так держать!', 'Супер!', 'Правильно!', 'Именно так!'];
const AUTO_NEXT_MS = 1100;
const INSTANT_KINDS = new Set(['choice', 'gap', 'listenchoice', 'truefalse', 'quiz']);

function correctAnswerOf(ex: Exercise): string {
  switch (ex.kind) {
    case 'choice':
    case 'listenchoice':
      return ex.answer;
    case 'gap':
      return ex.gap.text.replace('___', ex.gap.answer);
    case 'type':
      return ex.word.en;
    case 'build':
      return ex.sentence.en;
    case 'truefalse':
      return ex.isTrue ? 'Верно' : `Неверно. ${ex.sentence.en} — ${ex.sentence.ru}`;
    case 'quiz':
      return ex.quiz.answer;
    default:
      return '';
  }
}

function stepLabelOf(ex: Exercise): string {
  switch (ex.kind) {
    case 'word':
      return 'Новые слова';
    case 'rule':
      return 'Правило';
    case 'dialogue':
      return 'Диалог';
    case 'reading':
      return 'Текст';
    case 'quiz':
      return 'Вопросы по тексту';
    default:
      return 'Тренировка';
  }
}

export function Session({
  title,
  queue,
  settings,
  onExit,
  onFinish,
  onAnswer,
  onSnapshot,
  onToggleTurbo,
  initial,
  exitConfirm,
  headerExtra,
  noProgress,
}: Props) {
  const [items, setItems] = useState<Exercise[]>(initial?.items ?? queue);
  const [idx, setIdx] = useState(initial?.idx ?? 0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ready, setReady] = useState(false);
  const checkRef = useRef<ExerciseState['check'] | null>(null);
  const stats = useRef({ correct: initial?.correct ?? 0, wrong: initial?.wrong ?? 0, skipped: initial?.skipped ?? 0 });
  const finished = useRef(false);
  const autoTimer = useRef<number | null>(null);
  const nextRef = useRef<() => void>(() => undefined);

  const item = items[idx];
  const isCard = CARD_KINDS.has(item.kind);
  const turbo = settings.turbo;

  const clearAuto = () => {
    if (autoTimer.current !== null) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const applyResult = useCallback(
    (ok: boolean, answer: string) => {
      if (ok) {
        stats.current.correct += 1;
        setFeedback({ kind: 'ok', text: pick(PRAISE) });
        if (settings.sounds) playSfx('ok');
        if (settings.turbo) {
          clearAuto();
          autoTimer.current = window.setTimeout(() => nextRef.current(), AUTO_NEXT_MS);
        }
      } else {
        stats.current.wrong += 1;
        if (settings.sounds) playSfx('bad');
        setFeedback({
          kind: 'bad',
          text: item.kind === 'match' ? 'Все пары найдены, но были ошибки.' : 'Не совсем. Правильный ответ:',
          answer: answer || undefined,
        });
        if (!item.retry && item.kind !== 'match') {
          setItems((list) => [...list, { ...item, id: `${item.id}-retry`, retry: true }]);
        }
      }
      onAnswer?.(item, ok);
    },
    [item, onAnswer, settings.turbo, settings.sounds],
  );

  const onState = useCallback(
    (s: ExerciseState) => {
      setReady(s.ready);
      checkRef.current = s.check;
      if (turbo && s.ready && INSTANT_KINDS.has(item.kind)) {
        const r = s.check();
        applyResult(r.ok, r.answer);
      }
    },
    [turbo, item.kind, applyResult],
  );

  const next = useCallback(() => {
    clearAuto();
    stopSpeaking();
    setFeedback(null);
    setReady(false);
    checkRef.current = null;
    const { correct, wrong, skipped } = stats.current;
    if (idx + 1 >= items.length) {
      if (!finished.current) {
        finished.current = true;
        onFinish({ correct, wrong, skipped, total: correct + wrong });
      }
      return;
    }
    setIdx(idx + 1);
    onSnapshot?.({ items, idx: idx + 1, correct, wrong, skipped });
  }, [idx, items, onFinish, onSnapshot]);
  nextRef.current = next;

  const primary = useCallback(() => {
    if (feedback || isCard) {
      next();
      return;
    }
    if (!ready || !checkRef.current) return;
    const r = checkRef.current();
    applyResult(r.ok, r.answer);
  }, [feedback, isCard, ready, next, applyResult]);

  const skip = useCallback(() => {
    if (feedback || isCard) return;
    stats.current.skipped += 1;
    const answer = correctAnswerOf(item);
    setFeedback({ kind: 'skip', text: answer ? 'Пропущено. Правильный ответ:' : 'Пропущено.', answer: answer || undefined });
  }, [feedback, isCard, item]);

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

  useEffect(() => () => clearAuto(), []);

  const exit = () => {
    if (!exitConfirm || window.confirm(exitConfirm)) {
      clearAuto();
      stopSpeaking();
      onExit();
    }
  };

  const label = feedback
    ? 'Продолжить'
    : item.kind === 'word' || item.kind === 'dialogue' || item.kind === 'reading'
      ? 'Дальше'
      : item.kind === 'rule'
        ? 'Понятно'
        : 'Проверить';
  const disabled = feedback !== null;
  const result = feedback ? (feedback.kind === 'skip' ? null : feedback.kind === 'ok') : null;
  const noAudio = settings.noAudio;

  let body;
  switch (item.kind) {
    case 'word':
      body = <WordCard word={item.word} settings={settings} />;
      break;
    case 'rule':
      body = <RuleCard rule={item.rule} settings={settings} />;
      break;
    case 'dialogue':
      body = <DialogueCard lines={item.lines} speakers={item.speakers} settings={settings} />;
      break;
    case 'reading':
      body = <ReadingCard reading={item.reading} settings={settings} />;
      break;
    case 'choice':
      body = <ChoiceExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'listenchoice':
      body = <ListenChoiceExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'build':
      body = (
        <BuildExercise
          ex={noAudio && item.listen ? { ...item, listen: false } : item}
          disabled={disabled}
          result={result}
          onState={onState}
          settings={settings}
        />
      );
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
    case 'truefalse':
      body = <TrueFalseExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
    case 'quiz':
      body = <QuizExercise ex={item} disabled={disabled} result={result} onState={onState} settings={settings} />;
      break;
  }

  const footerCls = 'session-bottom' + (feedback ? ` ${feedback.kind}` : '');

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={exit} aria-label="Выйти">
          <IconClose size={22} />
        </button>
        {noProgress ? <div className="session-progress" /> : <ProgressBar value={idx / items.length} className="session-progress" />}
        {headerExtra}
        <button
          className={'turbo-btn' + (turbo ? ' on' : '')}
          onClick={() => onToggleTurbo?.(!turbo)}
          title="Турбо: ответ проверяется сразу после выбора, верный ответ ведёт дальше автоматически"
        >
          <IconBolt size={16} /> Турбо
        </button>
        <div className="session-title">
          {title} · {stepLabelOf(item)}
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
              <div className="feedback-icon">
                {feedback.kind === 'ok' ? <IconCheck size={26} /> : feedback.kind === 'bad' ? <IconCross size={26} /> : <span>→</span>}
              </div>
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
                    : turbo && INSTANT_KINDS.has(item.kind)
                      ? 'Турбо: выбери вариант'
                      : 'Enter — проверить'}
            </div>
          )}
          <div className="session-actions">
            {!feedback && !isCard && (
              <Button variant="ghost" onClick={skip}>
                Пропустить
              </Button>
            )}
            <Button
              size="lg"
              variant={feedback ? (feedback.kind === 'ok' ? 'success' : feedback.kind === 'bad' ? 'danger' : 'primary') : 'primary'}
              disabled={!feedback && !isCard && !ready}
              onClick={primary}
            >
              {label}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
