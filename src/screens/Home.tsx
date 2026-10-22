import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { allLessons, coreModules, findLesson, themeModules } from '../data/course';
import type { Lesson, Module } from '../data/types';
import { useProgress } from '../lib/progressContext';
import { dueWords, streakDays } from '../lib/srs';
import { loadSession } from '../lib/sessionStore';
import { QUEST_BONUS, dailyQuests, levelFor, todayStats, wordOfTheDay } from '../lib/stats';
import { speak } from '../lib/tts';
import { dateKey, pick, plural } from '../lib/utils';
import { Mascot } from '../components/Mascot';
import { ProgressBar } from '../components/ProgressBar';
import { UpdatePanel } from '../components/UpdatePanel';
import { WordImage } from '../components/WordImage';
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconCheck,
  IconCubes,
  IconDumbbell,
  IconFlame,
  IconLock,
  IconRefresh,
  IconSpeaker,
  IconStar,
} from '../components/Icons';

interface Props {
  onOpenLesson: (id: string) => void;
  onEndless: (moduleId: string) => void;
  onReview: () => void;
  onAchievements: () => void;
}

const GREETINGS = [
  'Готов учить английский?',
  'Каждый урок — шаг вперёд!',
  'Немного практики каждый день — и всё получится.',
  'Давай продолжим!',
  'Новые слова ждут тебя.',
];

export function Home({ onOpenLesson, onEndless, onReview, onAchievements }: Props) {
  const { progress } = useProgress();
  const todayXp = progress.days[dateKey()] ?? 0;
  const streak = streakDays(progress.days);
  const learned = Object.keys(progress.words).length;
  const due = dueWords(progress.words, Date.now()).length;
  const greeting = useMemo(() => pick(GREETINGS), []);
  const lvl = levelFor(progress.xp);
  const quests = dailyQuests(progress);
  const bonusGiven = todayStats(progress).bonus === true;
  const daily = useMemo(() => wordOfTheDay(), []);

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
  const paused = useMemo(() => loadSession()?.lessonId ?? null, []);

  return (
    <div className="page">
      <UpdatePanel compact />
      <section className="hero">
        <div className="hero-inner">
          <Mascot size={136} mood={todayXp >= goal ? 'excited' : 'happy'} className="hero-mascot" />
          <div className="hero-text">
            <h1>Привет, {progress.settings.name}!</h1>
            <p>{greeting}</p>
            <button className="level-badge" onClick={onAchievements} title="Достижения и уровни">
              <span className="level-num">{lvl.level}</span>
              <span className="level-text">
                <b>{lvl.title}</b>
                <small>{lvl.nextTitle ? `${progress.xp} / ${lvl.to} XP` : 'максимальный уровень'}</small>
              </span>
              <span className="level-bar">
                <span style={{ width: `${Math.round(lvl.pct * 100)}%` }} />
              </span>
            </button>
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

      <section className="daily">
        <div className="card quests">
          <div className="card-head">
            <h3>Задания дня</h3>
            <span className={'quest-bonus' + (bonusGiven ? ' on' : '')}>{bonusGiven ? `+${QUEST_BONUS} XP получено` : `бонус +${QUEST_BONUS} XP`}</span>
          </div>
          {quests.map((q) => (
            <div key={q.id} className={'quest' + (q.done ? ' done' : '')}>
              <span className="quest-emoji">{q.done ? <IconCheck size={18} /> : q.emoji}</span>
              <span className="quest-body">
                <span className="quest-title">{q.title}</span>
                <ProgressBar value={q.target > 0 ? q.value / q.target : 0} color={q.done ? '#45C86F' : '#399BFF'} height={6} />
              </span>
              <span className="quest-count">
                {q.value}/{q.target}
              </span>
            </div>
          ))}
        </div>
        <div className="card wotd">
          <div className="card-head">
            <h3>Слово дня</h3>
            <span className="muted">{daily.module.title}</span>
          </div>
          <div className="wotd-body">
            <WordImage img={daily.word.img} size={84} fallback={daily.word.en[0]?.toUpperCase()} />
            <div className="wotd-text">
              <div className="wotd-en">
                {daily.word.en}
                <button className="icon-btn" onClick={() => speak(daily.word.en, progress.settings)} title="Озвучить">
                  <IconSpeaker size={18} />
                </button>
              </div>
              <div className="wotd-trans">
                {daily.word.cy && <span className="cy-pill">{daily.word.cy}</span>}
                <span className="muted">{daily.word.ipa}</span>
              </div>
              <div className="wotd-ru">{daily.word.ru}</div>
              <div className="wotd-ex">
                <span>{daily.word.ex}</span>
                <small className="muted">{daily.word.exRu}</small>
              </div>
            </div>
          </div>
          {isUnlocked(daily.lesson) ? (
            <button className="link-btn" onClick={() => onOpenLesson(daily.lesson.id)}>
              Открыть урок «{daily.lesson.title}»
            </button>
          ) : (
            <div className="muted small">Из урока «{daily.lesson.title}» ({daily.module.title}), он откроется после предыдущих уроков модуля.</div>
          )}
        </div>
      </section>

      <h2 className="section-title">Основной курс</h2>
      {coreModules.map((m) => (
        <ModuleSection key={m.id} module={m} stars={stars} unlocked={isUnlocked} paused={paused} onOpen={onOpenLesson} onEndless={onEndless} />
      ))}

      <h2 className="section-title">Тематические модули</h2>
      <p className="section-note">Открыты сразу, проходить можно в любом порядке. У каждого модуля есть бесконечный режим ∞ со случайными заданиями.</p>
      {themeModules.map((m) => (
        <ModuleSection key={m.id} module={m} stars={stars} unlocked={isUnlocked} paused={paused} onOpen={onOpenLesson} onEndless={onEndless} />
      ))}
    </div>
  );
}

interface ModuleProps {
  module: Module;
  stars: (l: Lesson) => number;
  unlocked: (l: Lesson) => boolean;
  paused: string | null;
  onOpen: (id: string) => void;
  onEndless: (moduleId: string) => void;
}

function ModuleSection({ module, stars, unlocked, paused, onOpen, onEndless }: ModuleProps) {
  const done = module.lessons.filter((l) => stars(l) > 0).length;
  return (
    <section className="module">
      <header className="module-head">
        <span className="module-dot" style={{ background: module.color }} />
        <div className="module-titles">
          <h2>{module.title}</h2>
          <p>{module.description}</p>
        </div>
        <button className="endless-btn" onClick={() => onEndless(module.id)} title="Бесконечный режим: случайные задания по всему модулю">
          ∞ Бесконечный
        </button>
        <div className={'module-progress' + (done === module.lessons.length ? ' complete' : '')}>
          {done}/{module.lessons.length}
        </div>
      </header>
      <div className="lesson-grid">
        {module.lessons.map((l) => (
          <LessonCard
            key={l.id}
            lesson={l}
            color={module.color}
            stars={stars(l)}
            locked={!unlocked(l)}
            paused={paused === l.id}
            onOpen={() => onOpen(l.id)}
          />
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
  paused: boolean;
  onOpen: () => void;
}

function LessonCard({ lesson, color, stars, locked, paused, onOpen }: CardProps) {
  const status = locked ? 'locked' : stars > 0 ? 'done' : 'open';
  const n = lesson.words.length;
  return (
    <button className={`lesson-card ${status}`} disabled={locked} onClick={onOpen} style={{ '--accent': color } as CSSProperties}>
      <div className={`bubble ${status}`}>{locked ? <IconLock size={26} /> : <span className="bubble-emoji">{lesson.emoji}</span>}</div>
      <div className="lesson-info">
        <div className="lesson-title">
          {lesson.title}
          {lesson.type === 'dialogue' && <span className="lesson-type">диалог</span>}
          {lesson.type === 'reading' && <span className="lesson-type">текст</span>}
          {paused && <span className="paused-badge">продолжить</span>}
        </div>
        <div className="lesson-sub">{lesson.subtitle}</div>
        <div className="lesson-steps">
          <span className="step">
            <IconCubes size={14} /> {n} {plural(n, 'слово', 'слова', 'слов')}
          </span>
          <span className="step">
            <IconBook size={14} /> {lesson.type === 'dialogue' ? 'диалог' : lesson.type === 'reading' ? 'текст' : 'правило'}
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
