import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { allLessons, coreModules, findLesson, themeModules } from '../data/course';
import type { Lesson, Module } from '../data/types';
import { useProgress } from '../lib/progressContext';
import { dueWords, streakDays } from '../lib/srs';
import { dateKey, pick, plural } from '../lib/utils';
import { Mascot } from '../components/Mascot';
import { ProgressBar } from '../components/ProgressBar';
import { UpdatePanel } from '../components/UpdatePanel';
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconCubes,
  IconDumbbell,
  IconFlame,
  IconLock,
  IconRefresh,
  IconStar,
} from '../components/Icons';

interface Props {
  onOpenLesson: (id: string) => void;
  onReview: () => void;
}

const GREETINGS = [
  'Готов учить английский?',
  'Каждый урок — шаг вперёд!',
  'Немного практики каждый день — и всё получится.',
  'Давай продолжим!',
  'Новые слова ждут тебя.',
];

export function Home({ onOpenLesson, onReview }: Props) {
  const { progress } = useProgress();
  const todayXp = progress.days[dateKey()] ?? 0;
  const streak = streakDays(progress.days);
  const learned = Object.keys(progress.words).length;
  const due = dueWords(progress.words, Date.now()).length;
  const greeting = useMemo(() => pick(GREETINGS), []);

  const isDone = (l: Lesson) => (progress.lessons[l.id]?.stars ?? 0) > 0;

  /** Core modules unlock one after another; theme modules are open from the start. Inside a module lessons go in order. */
  const isUnlocked = (l: Lesson) => {
    if (progress.settings.unlockAll) return true;
    const mod = findLesson(l.id)!.module;
    const idx = mod.lessons.indexOf(l);
    if (idx > 0) return isDone(mod.lessons[idx - 1]);
    if (mod.kind === 'theme') return true;
    const coreIdx = coreModules.indexOf(mod);
    if (coreIdx <= 0) return true;
    const prev = coreModules[coreIdx - 1];
    return isDone(prev.lessons[prev.lessons.length - 1]);
  };

  const coreLessons = coreModules.flatMap((m) => m.lessons);
  const nextLesson =
    coreLessons.find((l) => !isDone(l)) ?? allLessons.find((l) => !isDone(l) && isUnlocked(l)) ?? null;
  const goal = progress.settings.dailyGoal;
  const goalPct = Math.min(1, todayXp / goal);

  const stars = (l: Lesson) => progress.lessons[l.id]?.stars ?? 0;

  return (
    <div className="page">
      <UpdatePanel compact />
      <section className="hero">
        <div className="hero-inner">
          <Mascot size={136} mood={todayXp >= goal ? 'excited' : 'happy'} className="hero-mascot" />
          <div className="hero-text">
            <h1>Привет, {progress.settings.name}!</h1>
            <p>{greeting}</p>
            <div className="goal-line">
              <span>
                Цель дня: <b>{todayXp}</b> / {goal} XP
              </span>
              <ProgressBar value={goalPct} color="#FFD346" height={10} className="goal-bar" />
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <IconFlame size={22} className="c-orange" />
              <b>{streak}</b>
              <span>{plural(streak, 'день', 'дня', 'дней')} подряд</span>
            </div>
            <div className="hero-stat">
              <IconBolt size={22} className="c-yellow" />
              <b>{progress.xp}</b>
              <span>XP всего</span>
            </div>
            <div className="hero-stat">
              <IconBook size={22} className="c-purple" />
              <b>{learned}</b>
              <span>{plural(learned, 'слово', 'слова', 'слов')}</span>
            </div>
          </div>
        </div>
        <div className="clouds" aria-hidden="true" />
      </section>

      <section className="quick">
        <button className="quick-card" onClick={() => nextLesson && onOpenLesson(nextLesson.id)} disabled={!nextLesson}>
          <div className="quick-emoji">{nextLesson ? nextLesson.emoji : '🏆'}</div>
          <div className="quick-text">
            <div className="quick-label">{nextLesson ? 'Следующий урок' : 'Курс пройден!'}</div>
            <div className="quick-title">{nextLesson ? nextLesson.title : 'Повторяй слова, чтобы не забыть'}</div>
          </div>
          <IconArrowRight size={22} className="quick-arrow" />
        </button>
        <button className="quick-card review" onClick={onReview}>
          <div className="quick-emoji">
            <IconRefresh size={28} />
          </div>
          <div className="quick-text">
            <div className="quick-label">Повторение</div>
            <div className="quick-title">
              {due > 0
                ? `${due} ${plural(due, 'слово ждёт', 'слова ждут', 'слов ждут')} повторения`
                : learned > 0
                  ? 'Все слова повторены'
                  : 'Сначала пройди урок'}
            </div>
          </div>
          {due > 0 && <span className="quick-badge">{due}</span>}
        </button>
      </section>

      <h2 className="section-title">Основной курс</h2>
      {coreModules.map((m) => (
        <ModuleSection key={m.id} module={m} stars={stars} unlocked={isUnlocked} onOpen={onOpenLesson} />
      ))}

      <h2 className="section-title">Тематические модули</h2>
      <p className="section-note">Открыты сразу, проходить можно в любом порядке.</p>
      {themeModules.map((m) => (
        <ModuleSection key={m.id} module={m} stars={stars} unlocked={isUnlocked} onOpen={onOpenLesson} />
      ))}
    </div>
  );
}

interface ModuleProps {
  module: Module;
  stars: (l: Lesson) => number;
  unlocked: (l: Lesson) => boolean;
  onOpen: (id: string) => void;
}

function ModuleSection({ module, stars, unlocked, onOpen }: ModuleProps) {
  const done = module.lessons.filter((l) => stars(l) > 0).length;
  return (
    <section className="module">
      <header className="module-head">
        <span className="module-dot" style={{ background: module.color }} />
        <div className="module-titles">
          <h2>{module.title}</h2>
          <p>{module.description}</p>
        </div>
        <div className={'module-progress' + (done === module.lessons.length ? ' complete' : '')}>
          {done}/{module.lessons.length}
        </div>
      </header>
      <div className="lesson-grid">
        {module.lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} color={module.color} stars={stars(l)} locked={!unlocked(l)} onOpen={() => onOpen(l.id)} />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  lesson: Lesson;
  color: string;
  stars: number;
  locked: boolean;
  onOpen: () => void;
}

function LessonCard({ lesson, color, stars, locked, onOpen }: CardProps) {
  const status = locked ? 'locked' : stars > 0 ? 'done' : 'open';
  const n = lesson.words.length;
  return (
    <button className={`lesson-card ${status}`} disabled={locked} onClick={onOpen} style={{ '--accent': color } as CSSProperties}>
      <div className={`bubble ${status}`}>{locked ? <IconLock size={26} /> : <span className="bubble-emoji">{lesson.emoji}</span>}</div>
      <div className="lesson-info">
        <div className="lesson-title">{lesson.title}</div>
        <div className="lesson-sub">{lesson.subtitle}</div>
        <div className="lesson-steps">
          <span className="step">
            <IconCubes size={14} /> {n} {plural(n, 'слово', 'слова', 'слов')}
          </span>
          <span className="step">
            <IconBook size={14} /> правило
          </span>
          <span className="step">
            <IconDumbbell size={14} /> тренировка
          </span>
        </div>
      </div>
      <div className="lesson-stars">
        {[1, 2, 3].map((i) => (
          <IconStar key={i} size={16} filled={i <= stars} className={i <= stars ? 'star-on' : 'star-off'} />
        ))}
      </div>
    </button>
  );
}
