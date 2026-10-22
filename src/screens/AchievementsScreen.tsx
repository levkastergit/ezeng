import { ACHIEVEMENT_GROUPS, achievementStatus } from '../lib/achievements';
import { useProgress } from '../lib/progressContext';
import { LEVELS, levelFor } from '../lib/stats';
import { ProgressBar } from '../components/ProgressBar';
import { Mascot } from '../components/Mascot';

export function AchievementsScreen() {
  const { progress } = useProgress();
  const status = achievementStatus(progress);
  const unlocked = status.filter((s) => s.unlockedAt !== null).length;
  const lvl = levelFor(progress.xp);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Достижения</h1>
        <p>
          Открыто {unlocked} из {status.length}. Достижения и уровень считаются по всему вашему прогрессу.
        </p>
      </div>

      <div className="level-card">
        <Mascot size={92} mood={lvl.level >= 5 ? 'excited' : 'happy'} shadow={false} />
        <div className="level-body">
          <div className="level-title">
            Уровень {lvl.level} · {lvl.title}
          </div>
          <ProgressBar value={lvl.pct} color="#FFD346" height={12} />
          <div className="muted">
            {lvl.nextTitle ? `${progress.xp} / ${lvl.to} XP до уровня «${lvl.nextTitle}»` : `${progress.xp} XP — максимальный уровень`}
          </div>
        </div>
        <div className="level-ladder">
          {LEVELS.map((l, i) => (
            <span key={l.xp} className={'level-step' + (i + 1 <= lvl.level ? ' on' : '')} title={`${l.xp} XP`}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {ACHIEVEMENT_GROUPS.map((g) => {
        const rows = status.filter((s) => s.a.group === g);
        return (
          <section key={g} className="ach-group">
            <h2 className="section-title">
              {g} <span className="muted">{rows.filter((r) => r.unlockedAt !== null).length}/{rows.length}</span>
            </h2>
            <div className="ach-grid">
              {rows.map(({ a, value, target, unlockedAt }) => (
                <div key={a.id} className={'ach-card' + (unlockedAt !== null ? ' on' : '')}>
                  <div className="ach-emoji">{a.emoji}</div>
                  <div className="ach-body">
                    <div className="ach-title">{a.title}</div>
                    <div className="ach-desc">{a.desc}</div>
                    {unlockedAt !== null ? (
                      <div className="ach-date">Открыто {new Date(unlockedAt).toLocaleDateString('ru-RU')}</div>
                    ) : (
                      <div className="ach-progress">
                        <ProgressBar value={target > 0 ? value / target : 0} color="#399BFF" height={6} />
                        <span>
                          {value}/{target}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
