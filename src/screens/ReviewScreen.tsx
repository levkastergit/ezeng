import { useState } from 'react';
import { allLessons, findLesson } from '../data/course';
import type { Word } from '../data/types';
import { buildReviewQueue } from '../lib/exercises';
import type { Exercise } from '../lib/exercises';
import { useProgress } from '../lib/progressContext';
import { dueWords, nextDue, reviewWord } from '../lib/srs';
import { dateKey, formatDue, plural, shuffle } from '../lib/utils';
import { Session } from '../components/Session';
import type { SessionResult } from '../components/Session';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';

interface Props {
  onGoHome: () => void;
}

const allWords: Word[] = allLessons.flatMap((l) => l.words);

export function ReviewScreen({ onGoHome }: Props) {
  const { progress, update } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'session' | 'done'>('intro');
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [reward, setReward] = useState<{ xp: number; result: SessionResult } | null>(null);

  const due = dueWords(progress.words, Date.now());
  const learnedCount = Object.keys(progress.words).length;
  const next = nextDue(progress.words);

  const start = (all: boolean) => {
    const source = all ? shuffle(Object.values(progress.words)).slice(0, 12) : due.slice(0, 12);
    const items = source
      .map((ws) => {
        const lesson = findLesson(ws.lessonId)?.lesson;
        const word = lesson?.words.find((w) => w.en === ws.en);
        return word && lesson ? { word, lessonId: lesson.id } : null;
      })
      .filter((x): x is { word: Word; lessonId: string } => x !== null);
    if (items.length === 0) return;
    setQueue(buildReviewQueue(items, allWords));
    setPhase('session');
  };

  const onAnswer = (ex: Exercise, ok: boolean) => {
    const keys = ex.kind === 'choice' || ex.kind === 'type' ? [ex.wordKey] : ex.kind === 'match' ? ex.pairs.map((p) => p.key) : [];
    if (keys.length === 0) return;
    update((p) => {
      const words = { ...p.words };
      const t = Date.now();
      keys.forEach((k) => {
        if (words[k]) words[k] = reviewWord(words[k], ok, t);
      });
      return { ...p, words };
    });
  };

  const onFinish = (r: SessionResult) => {
    const xp = r.correct * 2;
    update((p) => {
      const dk = dateKey();
      return { ...p, xp: p.xp + xp, days: { ...p.days, [dk]: (p.days[dk] ?? 0) + xp } };
    });
    setReward({ xp, result: r });
    setPhase('done');
  };

  if (phase === 'session') {
    return (
      <Session
        title="Повторение"
        queue={queue}
        settings={progress.settings}
        onExit={() => setPhase('intro')}
        onFinish={onFinish}
        onAnswer={onAnswer}
        onToggleTurbo={(on) => update((p) => ({ ...p, settings: { ...p.settings, turbo: on } }))}
        exitConfirm="Прервать повторение?"
      />
    );
  }

  if (phase === 'done' && reward) {
    const acc = reward.result.total > 0 ? Math.round((reward.result.correct / reward.result.total) * 100) : 100;
    return (
      <div className="result-screen">
        <div className="result-card">
          <Mascot size={170} mood={acc >= 80 ? 'excited' : 'happy'} />
          <h1>Повторение завершено!</h1>
          <p className="result-sub">Слова, в которых были ошибки, скоро появятся снова.</p>
          <div className="result-stats">
            <div className="result-stat">
              <b>+{reward.xp}</b>
              <span>XP</span>
            </div>
            <div className="result-stat">
              <b>{acc}%</b>
              <span>точность</span>
            </div>
            <div className="result-stat">
              <b>{reward.result.correct}</b>
              <span>верных</span>
            </div>
          </div>
          <Button size="lg" onClick={() => setPhase('intro')}>
            Готово
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Повторение</h1>
        <p>Интервальные повторения: слова возвращаются как раз тогда, когда ты начинаешь их забывать.</p>
      </div>
      <div className="review-hero">
        <Mascot size={150} mood={due.length > 0 ? 'neutral' : 'happy'} />
        {learnedCount === 0 ? (
          <>
            <h2>Пока нечего повторять</h2>
            <p>Пройди хотя бы один урок — выученные слова появятся здесь на следующий день.</p>
            <Button size="lg" onClick={onGoHome}>
              К урокам
            </Button>
          </>
        ) : due.length > 0 ? (
          <>
            <h2>
              {due.length} {plural(due.length, 'слово ждёт', 'слова ждут', 'слов ждут')} повторения
            </h2>
            <p>За одно занятие — до 12 слов. Это займёт пару минут.</p>
            <Button size="lg" onClick={() => start(false)}>
              Начать повторение
            </Button>
          </>
        ) : (
          <>
            <h2>Все слова повторены</h2>
            <p>Следующее повторение {next ? formatDue(next) : 'скоро'}. Можно потренироваться и раньше.</p>
            <div className="btn-row">
              <Button size="lg" variant="secondary" onClick={() => start(true)}>
                Повторить случайные слова
              </Button>
              <Button size="lg" onClick={onGoHome}>
                К урокам
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="review-stats">
        <div className="stat-card">
          <b>{learnedCount}</b>
          <span>слов в словаре</span>
        </div>
        <div className="stat-card">
          <b>{due.length}</b>
          <span>к повторению</span>
        </div>
        <div className="stat-card">
          <b>{Object.values(progress.words).filter((w) => w.reps >= 3).length}</b>
          <span>хорошо выучено</span>
        </div>
      </div>
    </div>
  );
}
