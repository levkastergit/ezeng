import type { ReactNode } from 'react';
import { Mascot } from './Mascot';
import { useUpdateState } from '../lib/updater';
import { useAuth } from '../lib/authContext';
import {
  IconBook,
  IconBolt,
  IconFlame,
  IconGear,
  IconGem,
  IconMedal,
  IconMusic,
  IconPath,
  IconRefresh,
  IconSpeech,
  IconTrophy,
  IconUser,
  IconWave,
} from './Icons';

export type NavName =
  | 'home'
  | 'review'
  | 'dictionary'
  | 'sounds'
  | 'twisters'
  | 'songs'
  | 'tales'
  | 'test'
  | 'profile'
  | 'achievements'
  | 'gacha'
  | 'settings';

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
  { name: 'tales', label: 'Сказки', icon: <IconBook size={22} /> },
  { name: 'test', label: 'Тест уровня', icon: <IconTrophy size={22} /> },
  { name: 'profile', label: 'Профиль', icon: <IconUser size={22} /> },
  { name: 'achievements', label: 'Достижения', icon: <IconMedal size={22} /> },
  { name: 'gacha', label: 'Гача и игры', icon: <IconGem size={22} /> },
  { name: 'settings', label: 'Настройки', icon: <IconGear size={22} /> },
];

const SYNC_TEXT: Record<string, string> = {
  idle: '',
  syncing: 'синхронизация…',
  synced: 'сохранено на сервере',
  offline: 'офлайн, сохранено локально',
  error: 'ошибка синхронизации',
};

export function Sidebar({ current, onNavigate, dueCount, streak, xp }: Props) {
  const update = useUpdateState();
  const { user, sync } = useAuth();
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
      <button className="account-chip" onClick={() => onNavigate('settings')} title={user ? SYNC_TEXT[sync] : 'Войти или создать аккаунт'}>
        <span className={'sync-dot ' + (user ? sync : 'guest')} />
        <span className="account-name">{user ? user.login : 'Гость'}</span>
        <span className="account-sub">{user ? SYNC_TEXT[sync] : 'без аккаунта'}</span>
      </button>
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
