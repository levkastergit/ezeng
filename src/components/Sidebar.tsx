import type { ReactNode } from 'react';
import { Mascot } from './Mascot';
import { useUpdateState } from '../lib/updater';
import {
  IconBook,
  IconBolt,
  IconFlame,
  IconGear,
  IconMusic,
  IconPath,
  IconRefresh,
  IconSpeech,
  IconUser,
  IconWave,
} from './Icons';

export type NavName = 'home' | 'review' | 'dictionary' | 'sounds' | 'twisters' | 'songs' | 'profile' | 'settings';

interface Props {
  current: NavName;
  onNavigate: (name: NavName) => void;
  dueCount: number;
  streak: number;
  xp: number;
}

const items: { name: NavName; label: string; icon: ReactNode }[] = [
  { name: 'home', label: 'Уроки', icon: <IconPath size={22} /> },
  { name: 'review', label: 'Повторение', icon: <IconRefresh size={22} /> },
  { name: 'dictionary', label: 'Словарь', icon: <IconBook size={22} /> },
  { name: 'sounds', label: 'Звуки и алфавит', icon: <IconWave size={22} /> },
  { name: 'twisters', label: 'Скороговорки', icon: <IconSpeech size={22} /> },
  { name: 'songs', label: 'Песни', icon: <IconMusic size={22} /> },
  { name: 'profile', label: 'Профиль', icon: <IconUser size={22} /> },
  { name: 'settings', label: 'Настройки', icon: <IconGear size={22} /> },
];

export function Sidebar({ current, onNavigate, dueCount, streak, xp }: Props) {
  const update = useUpdateState();
  const updateReady = update.phase === 'available' || update.phase === 'downloaded';
  return (
    <aside className="sidebar">
      <div className="brand">
        <Mascot size={44} mood="happy" shadow={false} />
        <div className="brand-name">EzEng</div>
      </div>
      <nav className="nav">
        {items.map((it) => (
          <button
            key={it.name}
            className={`nav-item${current === it.name ? ' active' : ''}`}
            onClick={() => onNavigate(it.name)}
            data-nav={it.name}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
            {it.name === 'review' && dueCount > 0 && <span className="nav-badge">{dueCount}</span>}
            {it.name === 'settings' && updateReady && <span className="nav-dot" title="Доступно обновление" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-stats">
        <div className="side-stat" title="Дней подряд">
          <IconFlame size={18} className="c-orange" />
          <span>{streak}</span>
        </div>
        <div className="side-stat" title="Всего XP">
          <IconBolt size={18} className="c-yellow" />
          <span>{xp}</span>
        </div>
      </div>
    </aside>
  );
}
