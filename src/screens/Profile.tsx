import { allLessons, modules, totalWords } from '../data/course';
import { useProgress } from '../lib/progressContext';
import { streakDays } from '../lib/srs';
import { WEEKDAYS_SHORT, addDays, dateKey, plural } from '../lib/utils';
import { Mascot } from '../components/Mascot';
import { IconBolt, IconBook, IconFlame, IconTrophy } from '../components/Icons';

export function Profile() {
  const { progress } = useProgress();
  const streak = streakDays(progress.days);
  const learned = Object.keys(progress.words).length;
  const lessonsDone = allLessons.filter((l) => (progress.lessons[l.id]?.stars ?? 0) > 0).length;
  const starsTotal = allLessons.reduce((n, l) => n + (progress.lessons[l.id]?.stars ?? 0), 0);
  const today = progress.days[dateKey()] ?? 0;
  const goal = progress.settings.dailyGoal;
  const pct = Math.min(1, today / goal);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    return { key: dateKey(d), label: WEEKDAYS_SHORT[d.getDay()], xp: progress.days[dateKey(d)] ?? 0 };
  });
  const maxXp = Math.max(goal, ...week.map((w) => w.xp));

  const r = 40;
  const c = 2 * Math.PI * r;
  const bestStreak = (() => {
    const keys = Object.keys(progress.days)
      .filter((k) => progress.days[k] > 0)
      .sort();
    let best = 0;
    let cur = 0;
    let prev: Date | null = null;
    keys.forEach((k) => {
      const d = new Date(k + 'T00:00:00');
      if (prev && d.getTime() - prev.getTime() === 86_400_000) cur += 1;
      else cur = 1;
      best = Math.max(best, cur);
      prev = d;
    });
    return best;
  })();

  return (
    <div className="page">
      <div className="profile-head">
        <div className="avatar">
          <Mascot size={96} mood="happy" shadow={false} />
        </div>
        <div>
          <h1>{progress.settings.name}</h1>
          <p>Учит английский с {new Date(progress.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <IconFlame size={26} className="c-orange" />
          <b>{streak}</b>
          <span>{plural(streak, 'день', 'дня', 'дней')} подряд</span>
        </div>
        <div className="stat-card">
          <IconBolt size={26} className="c-yellow" />
          <b>{progress.xp}</b>
          <span>XP всего</span>
        </div>
        <div className="stat-card">
          <IconBook size={26} className="c-purple" />
          <b>{learned}</b>
          <span>из {totalWords} слов</span>
        </div>
        <div className="stat-card">
          <IconTrophy size={26} className="c-blue" />
          <b>{lessonsDone}</b>
          <span>из {allLessons.length} уроков</span>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Цель на сегодня</h3>
          <div className="ring-row">
            <svg viewBox="0 0 100 100" width="120" height="120" className="ring">
              <circle cx="50" cy="50" r={r} stroke="#E9EDF3" strokeWidth="10" fill="none" />
              <circle
                cx="50"
                cy="50"
                r={r}
                stroke={pct >= 1 ? '#45C86F' : '#399BFF'}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - pct)}
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#19191B">
                {Math.round(pct * 100)}%
              </text>
            </svg>
            <div>
              <div className="ring-value">
                {today} / {goal} XP
              </div>
              <div className="muted">{pct >= 1 ? 'Цель выполнена — отлично!' : `Ещё ${goal - today} XP до цели`}</div>
              <div className="muted">Лучшая серия: {bestStreak} {plural(bestStreak, 'день', 'дня', 'дней')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Последние 7 дней</h3>
          <div className="week">
            {week.map((d) => (
              <div key={d.key} className="week-col">
                <div className="week-bar">
                  <div className={'week-fill' + (d.xp >= goal ? ' hit' : '')} style={{ height: `${Math.round((d.xp / maxXp) * 100)}%` }} />
                </div>
                <div className="week-xp">{d.xp}</div>
                <div className="week-label">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Прогресс по модулям</h3>
        <div className="module-list">
          {modules.map((m) => {
            const done = m.lessons.filter((l) => (progress.lessons[l.id]?.stars ?? 0) > 0).length;
            const stars = m.lessons.reduce((n, l) => n + (progress.lessons[l.id]?.stars ?? 0), 0);
            return (
              <div key={m.id} className="module-row">
                <span className="module-dot" style={{ background: m.color }} />
                <div className="module-row-title">{m.title}</div>
                <div className="module-row-bar">
                  <div style={{ width: `${(done / m.lessons.length) * 100}%`, background: m.color }} />
                </div>
                <div className="module-row-meta">
                  {done}/{m.lessons.length} · {stars} ★
                </div>
              </div>
            );
          })}
        </div>
        <div className="muted" style={{ marginTop: 12 }}>
          Всего звёзд: {starsTotal} из {allLessons.length * 3}
        </div>
      </div>
    </div>
  );
}
