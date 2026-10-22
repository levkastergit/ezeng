import { useMemo, useState } from 'react';
import { findLesson, wordKey } from '../data/course';
import { buildLessonQueue } from '../lib/exercises';
import { useProgress } from '../lib/progressContext';
import { clearSession, loadSession, saveSession } from '../lib/sessionStore';
import { bumpDaily } from '../lib/storage';
import { initWord } from '../lib/srs';
import { dateKey, plural } from '../lib/utils';
import { Session } from '../components/Session';
import type { SessionResult, SessionSnapshot } from '../components/Session';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { IconStar } from '../components/Icons';

interface Props {
  lessonId: string;
  onExit: () => void;
}

interface Reward {
  xp: number;
  stars: number;
  newWords: number;
  accuracy: number;
  boosted: boolean;
}

export function LessonScreen({ lessonId, onExit }: Props) {
  const { progress, update } = useProgress();
  const lesson = findLesson(lessonId)?.lesson;

  // Resume a lesson that was left half-way; otherwise build a fresh queue.
  const saved = useMemo(() => {
    const s = loadSession();
    return s && s.lessonId === lessonId ? s : null;
  }, [lessonId]);
  const queue = useMemo(() => (lesson ? (saved ? saved.items : buildLessonQueue(lesson)) : []), [lesson, saved]);
  const [reward, setReward] = useState<Reward | null>(null);

  if (!lesson) return null;

  const onSnapshot = (s: SessionSnapshot) => saveSession({ lessonId: lesson.id, ...s, savedAt: Date.now() });

  const handleFinish = (r: SessionResult) => {
    clearSession();
    const answered = r.correct + r.wrong + r.skipped;
    const accuracy = answered > 0 ? r.correct / answered : 1;
    const stars = r.wrong === 0 && r.skipped === 0 ? 3 : accuracy >= 0.8 ? 2 : 1;
    const boosted = (progress.gacha?.boosts ?? 0) > 0;
    const xp = (10 + r.correct) * (boosted ? 2 : 1);
    const now = Date.now();
    const newWords = lesson.words.filter((w) => !progress.words[wordKey(lesson.id, w.en)]).length;

    update((p) => {
      const words = { ...p.words };
      lesson.words.forEach((w) => {
        const k = wordKey(lesson.id, w.en);
        if (!words[k]) words[k] = initWord(k, lesson.id, w.en, now);
      });
      const prev = p.lessons[lesson.id];
      const lessons = {
        ...p.lessons,
        [lesson.id]: {
          stars: Math.max(prev?.stars ?? 0, stars),
          completed: (prev?.completed ?? 0) + 1,
          lastAt: now,
          bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
        },
      };
      const dk = dateKey();
      const gacha = boosted && p.gacha ? { ...p.gacha, boosts: Math.max(0, p.gacha.boosts - 1) } : p.gacha;
      return bumpDaily({ ...p, xp: p.xp + xp, days: { ...p.days, [dk]: (p.days[dk] ?? 0) + xp }, lessons, words, gacha }, { lessons: 1, correct: r.correct });
    });
    setReward({ xp, stars, newWords, accuracy, boosted });
  };

  if (reward) {
    const title = reward.stars === 3 ? 'Идеально!' : reward.stars === 2 ? 'Отличная работа!' : 'Урок пройден!';
    return (
      <div className="result-screen">
        <div className="result-card">
          <Mascot size={170} mood={reward.stars === 3 ? 'excited' : reward.stars === 2 ? 'happy' : 'neutral'} />
          <h1>{title}</h1>
          <p className="result-sub">Урок «{lesson.title}» завершён</p>
          <div className="stars-row">
            {[1, 2, 3].map((i) => (
              <IconStar key={i} size={44} filled={i <= reward.stars} className={i <= reward.stars ? 'star-on' : 'star-off'} />
            ))}
          </div>
          <div className="result-stats">
            <div className="result-stat">
              <b>+{reward.xp}</b>
              <span>{reward.boosted ? 'XP (бустер ×2)' : 'XP'}</span>
            </div>
            <div className="result-stat">
              <b>{Math.round(reward.accuracy * 100)}%</b>
              <span>точность</span>
            </div>
            <div className="result-stat">
              <b>{reward.newWords}</b>
              <span>{plural(reward.newWords, 'новое слово', 'новых слова', 'новых слов')}</span>
            </div>
          </div>
          <Button size="lg" onClick={onExit}>
            Продолжить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Session
      title={lesson.title}
      queue={queue}
      initial={saved ?? undefined}
      settings={progress.settings}
      onExit={onExit}
      onFinish={handleFinish}
      onSnapshot={onSnapshot}
      onToggleTurbo={(on) => update((p) => ({ ...p, settings: { ...p.settings, turbo: on } }))}
    />
  );
}
