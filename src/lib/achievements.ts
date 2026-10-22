import { coreModules, themeModules } from '../data/course';
import { tales } from '../data/tales';
import type { Progress } from './storage';
import { QUEST_BONUS, bestStreak, lessonsDone, moduleDone, perfectLessons, questsDone, sumDaily, todayStats } from './stats';
import { streakDays } from './srs';
import { dateKey } from './utils';

export type AchievementGroup = 'Уроки' | 'Слова' | 'Серии' | 'Опыт' | 'Режимы' | 'Особые';

export interface Achievement {
  id: string;
  group: AchievementGroup;
  emoji: string;
  title: string;
  desc: string;
  /** Returns progress towards the goal as [value, target]; unlocked when value >= target. */
  progress: (p: Progress, h: Helpers) => [number, number];
}

interface Helpers {
  lessons: number;
  perfect: number;
  words: number;
  streak: number;
  best: number;
  hours: number[];
}

const A = (
  id: string,
  group: AchievementGroup,
  emoji: string,
  title: string,
  desc: string,
  progress: Achievement['progress'],
): Achievement => ({ id, group, emoji, title, desc, progress });

const goalDays = (p: Progress) => Object.keys(p.days).filter((k) => p.days[k] >= p.settings.dailyGoal).length;

export const ACHIEVEMENTS: Achievement[] = [
  // --- lessons
  A('first_lesson', 'Уроки', '🎓', 'Первый шаг', 'Пройти первый урок', (_p, h) => [h.lessons, 1]),
  A('lessons_5', 'Уроки', '📘', 'Втянулся', 'Пройти 5 уроков', (_p, h) => [h.lessons, 5]),
  A('lessons_15', 'Уроки', '📚', 'Прилежный ученик', 'Пройти 15 уроков', (_p, h) => [h.lessons, 15]),
  A('lessons_30', 'Уроки', '🏫', 'Полкурса позади', 'Пройти 30 уроков', (_p, h) => [h.lessons, 30]),
  A('lessons_60', 'Уроки', '🎖️', 'Марафонец', 'Пройти 60 уроков', (_p, h) => [h.lessons, 60]),
  A('perfect_1', 'Уроки', '⭐', 'Без ошибок', 'Пройти урок на три звезды', (_p, h) => [h.perfect, 1]),
  A('perfect_10', 'Уроки', '🌟', 'Перфекционист', 'Десять уроков на три звезды', (_p, h) => [h.perfect, 10]),
  A('perfect_30', 'Уроки', '💫', 'Звёздный путь', 'Тридцать уроков на три звезды', (_p, h) => [h.perfect, 30]),
  A('core_module', 'Уроки', '🧩', 'Модуль закрыт', 'Пройти все уроки одного модуля основного курса', (p) => [coreModules.filter((m) => moduleDone(p, m)).length, 1]),
  A('core_all', 'Уроки', '🏆', 'Основной курс', 'Пройти все модули основного курса', (p) => [coreModules.filter((m) => moduleDone(p, m)).length, coreModules.length]),
  A('theme_module', 'Уроки', '🎮', 'По интересам', 'Пройти все уроки одного тематического модуля', (p) => [themeModules.filter((m) => moduleDone(p, m)).length, 1]),
  A('theme_3', 'Уроки', '🕹️', 'Коллекционер тем', 'Пройти три тематических модуля целиком', (p) => [themeModules.filter((m) => moduleDone(p, m)).length, 3]),
  // --- words
  A('words_50', 'Слова', '🔤', 'Первые 50', 'Выучить 50 слов', (_p, h) => [h.words, 50]),
  A('words_150', 'Слова', '📖', 'Словарный запас', 'Выучить 150 слов', (_p, h) => [h.words, 150]),
  A('words_300', 'Слова', '🧠', 'Эрудит', 'Выучить 300 слов', (_p, h) => [h.words, 300]),
  A('words_500', 'Слова', '📕', 'Полтысячи', 'Выучить 500 слов', (_p, h) => [h.words, 500]),
  A('words_800', 'Слова', '🗂️', 'Большой словарь', 'Выучить 800 слов', (_p, h) => [h.words, 800]),
  A('review_1', 'Слова', '🔁', 'Повторение — мать учения', 'Провести первое повторение', (p) => [sumDaily(p, 'reviews'), 1]),
  A('review_10', 'Слова', '🔂', 'Не забываю', 'Провести 10 повторений', (p) => [sumDaily(p, 'reviews'), 10]),
  A('review_50', 'Слова', '🧲', 'Железная память', 'Провести 50 повторений', (p) => [sumDaily(p, 'reviews'), 50]),
  A('strong_50', 'Слова', '💪', 'Крепко сидит', '50 слов повторены три раза и больше', (p) => [Object.values(p.words).filter((w) => w.reps >= 3).length, 50]),
  // --- streaks
  A('streak_3', 'Серии', '🔥', 'Разогрев', 'Заниматься 3 дня подряд', (_p, h) => [Math.max(h.streak, h.best), 3]),
  A('streak_7', 'Серии', '🔥', 'Неделя', 'Заниматься 7 дней подряд', (_p, h) => [Math.max(h.streak, h.best), 7]),
  A('streak_14', 'Серии', '🔥', 'Две недели', 'Заниматься 14 дней подряд', (_p, h) => [Math.max(h.streak, h.best), 14]),
  A('streak_30', 'Серии', '🌋', 'Месяц без пропусков', 'Заниматься 30 дней подряд', (_p, h) => [Math.max(h.streak, h.best), 30]),
  A('goal_1', 'Серии', '🎯', 'Цель дня', 'Выполнить дневную цель по XP', (p) => [goalDays(p), 1]),
  A('goal_7', 'Серии', '🏹', 'Неделя целей', 'Выполнить дневную цель 7 раз', (p) => [goalDays(p), 7]),
  A('goal_30', 'Серии', '🥇', 'Месяц целей', 'Выполнить дневную цель 30 раз', (p) => [goalDays(p), 30]),
  A('quests_1', 'Серии', '📋', 'Все задания дня', 'Выполнить все три задания дня', (p) => [Object.values(p.daily ?? {}).filter((d) => d.bonus).length, 1]),
  A('quests_10', 'Серии', '🗓️', 'Десять дней заданий', 'Выполнить задания дня 10 раз', (p) => [Object.values(p.daily ?? {}).filter((d) => d.bonus).length, 10]),
  // --- xp
  A('xp_100', 'Опыт', '⚡', 'Первая сотня', 'Набрать 100 XP', (p) => [p.xp, 100]),
  A('xp_500', 'Опыт', '⚡', 'Пятьсот', 'Набрать 500 XP', (p) => [p.xp, 500]),
  A('xp_1000', 'Опыт', '🔋', 'Тысяча', 'Набрать 1000 XP', (p) => [p.xp, 1000]),
  A('xp_3000', 'Опыт', '🚀', 'Три тысячи', 'Набрать 3000 XP', (p) => [p.xp, 3000]),
  A('xp_5500', 'Опыт', '👑', 'Легенда', 'Набрать 5500 XP и достичь последнего уровня', (p) => [p.xp, 5500]),
  A('correct_100', 'Опыт', '✅', 'Сто верных', 'Дать 100 верных ответов', (p) => [sumDaily(p, 'correct'), 100]),
  A('correct_1000', 'Опыт', '💯', 'Тысяча верных', 'Дать 1000 верных ответов', (p) => [sumDaily(p, 'correct'), 1000]),
  // --- modes
  A('endless_10', 'Режимы', '♾️', 'Серия 10', 'Серия из 10 верных ответов в бесконечном режиме', (p) => [p.endlessBest ?? 0, 10]),
  A('endless_25', 'Режимы', '♾️', 'Серия 25', 'Серия из 25 верных ответов в бесконечном режиме', (p) => [p.endlessBest ?? 0, 25]),
  A('endless_50', 'Режимы', '🌀', 'Серия 50', 'Серия из 50 верных ответов в бесконечном режиме', (p) => [p.endlessBest ?? 0, 50]),
  A('endless_200', 'Режимы', '🎰', 'Бесконечность не предел', '200 ответов в бесконечном режиме', (p) => [p.endlessAnswers ?? 0, 200]),
  A('test_1', 'Режимы', '📝', 'Проверка уровня', 'Пройти тест на уровень языка', (p) => [p.tests.length, 1]),
  A('test_a2', 'Режимы', '🅰️', 'Уровень A2', 'Получить в тесте уровень A2 или выше', (p) => [p.tests.some((t) => t.score >= 2) ? 1 : 0, 1]),
  A('test_b1', 'Режимы', '🅱️', 'Уровень B1', 'Получить в тесте уровень B1 или выше', (p) => [p.tests.some((t) => t.score >= 3) ? 1 : 0, 1]),
  A('tale_1', 'Режимы', '📖', 'Сказка на ночь', 'Дочитать одну сказку', (p) => [p.talesDone.length, 1]),
  A('tales_all', 'Режимы', '🧚', 'Сказочник', 'Дочитать все сказки', (p) => [p.talesDone.length, tales.length]),
  A('song_1', 'Режимы', '🎵', 'Своя песня', 'Добавить свою песню в раздел песен', (p) => [p.customSongs.length, 1]),
  // --- special
  A('early_bird', 'Особые', '🌅', 'Ранняя пташка', 'Пройти урок между 5 и 8 утра', (_p, h) => [h.hours.some((x) => x >= 5 && x < 8) ? 1 : 0, 1]),
  A('night_owl', 'Особые', '🦉', 'Сова', 'Пройти урок между полуночью и 4 утра', (_p, h) => [h.hours.some((x) => x >= 0 && x < 4) ? 1 : 0, 1]),
  A('weekend', 'Особые', '🛋️', 'Выходной с пользой', 'Заниматься в субботу и воскресенье', (p) => {
    const days = Object.keys(p.days).filter((k) => p.days[k] > 0);
    const sat = days.some((k) => new Date(k + 'T00:00:00').getDay() === 6);
    const sun = days.some((k) => new Date(k + 'T00:00:00').getDay() === 0);
    return [(sat ? 1 : 0) + (sun ? 1 : 0), 2];
  }),
  A('turbo', 'Особые', '⚡', 'Турбо', 'Включить турбо-режим', (p) => [p.settings.turbo ? 1 : 0, 1]),
  A('big_day', 'Особые', '🏋️', 'Большой день', 'Набрать 150 XP за один день', (p) => [Math.max(0, ...Object.values(p.days)), 150]),
];

export const ACHIEVEMENT_GROUPS: AchievementGroup[] = ['Уроки', 'Слова', 'Серии', 'Опыт', 'Режимы', 'Особые'];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

function helpers(p: Progress): Helpers {
  return {
    lessons: lessonsDone(p),
    perfect: perfectLessons(p),
    words: Object.keys(p.words).length,
    streak: streakDays(p.days),
    best: bestStreak(p),
    hours: Object.values(p.lessons).map((l) => new Date(l.lastAt).getHours()),
  };
}

export interface AchievementStatus {
  a: Achievement;
  value: number;
  target: number;
  unlockedAt: number | null;
}

export function achievementStatus(p: Progress): AchievementStatus[] {
  const h = helpers(p);
  return ACHIEVEMENTS.map((a) => {
    const [value, target] = a.progress(p, h);
    return { a, value: Math.min(value, target), target, unlockedAt: p.achievements?.[a.id] ?? null };
  });
}

export interface RewardResult {
  progress: Progress;
  unlocked: string[];
  questBonus: boolean;
}

/** Grants newly earned achievements and the daily-quest bonus. Pure: returns the same object when nothing changed. */
export function applyRewards(p: Progress, now: number = Date.now()): RewardResult {
  let next = p;
  let questBonus = false;

  const today = dateKey(new Date(now));
  const d = todayStats(p, today);
  if (!d.bonus && questsDone(p, today)) {
    questBonus = true;
    next = {
      ...next,
      xp: next.xp + QUEST_BONUS,
      days: { ...next.days, [today]: (next.days[today] ?? 0) + QUEST_BONUS },
      daily: { ...(next.daily ?? {}), [today]: { ...d, bonus: true } },
    };
  }

  const h = helpers(next);
  const have = next.achievements ?? {};
  const unlocked: string[] = [];
  ACHIEVEMENTS.forEach((a) => {
    if (have[a.id]) return;
    const [value, target] = a.progress(next, h);
    if (value >= target) unlocked.push(a.id);
  });
  if (unlocked.length) {
    const achievements = { ...have };
    unlocked.forEach((id) => {
      achievements[id] = now;
    });
    next = { ...next, achievements };
  }
  if (next !== p) next = { ...next, updatedAt: now };
  return { progress: next, unlocked, questBonus };
}
