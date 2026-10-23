import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressContext } from './lib/progressContext';
import type { Progress } from './lib/storage';
import {
  LEGACY_KEY,
  hasStoredProgress,
  loadProgress,
  normalizeProgress,
  saveProgress,
  setStorageScope,
} from './lib/storage';
import { api, apiAvailable, setToken } from './lib/api';
import type { ApiUser } from './lib/api';
import { AuthContext } from './lib/authContext';
import type { SyncStatus } from './lib/authContext';
import { achievementById, applyRewards } from './lib/achievements';
import { QUEST_BONUS } from './lib/stats';
import { playSfx } from './lib/sfx';
import { dueWords, streakDays } from './lib/srs';
import { dateKey, uid } from './lib/utils';
import { loginInfo } from './lib/gacha';
import { Sidebar } from './components/Sidebar';
import type { NavName } from './components/Sidebar';
import { ToastStack } from './components/Toast';
import type { ToastItem } from './components/Toast';
import { Home } from './screens/Home';
import { LessonScreen } from './screens/LessonScreen';
import { EndlessScreen } from './screens/EndlessScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { Dictionary } from './screens/Dictionary';
import { Profile } from './screens/Profile';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { ArcadeScreen } from './screens/ArcadeScreen';
import { SettingsScreen } from './screens/Settings';
import { SoundsScreen } from './screens/SoundsScreen';
import { TwistersScreen } from './screens/TwistersScreen';
import { SongsScreen } from './screens/SongsScreen';
import { TalesScreen } from './screens/TalesScreen';
import { TestScreen } from './screens/TestScreen';
import { LoginScreen } from './screens/LoginScreen';

type Screen = { name: NavName } | { name: 'lesson'; lessonId: string } | { name: 'endless'; moduleId: string };

const GUEST_FLAG = 'ezeng.guestChosen';
const PUSH_DELAY_MS = 2500;

function hasContent(p: Progress): boolean {
  return p.xp > 0 || Object.keys(p.lessons).length > 0 || Object.keys(p.words).length > 0 || p.customSongs.length > 0 || p.tests.length > 0;
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [sync, setSync] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState<Progress>(() => loadProgress(LEGACY_KEY));
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushTimer = useRef<number | null>(null);
  const userRef = useRef<ApiUser | null>(null);
  userRef.current = user;
  /** Set while loading a profile so that achievements earned before 1.4.0 are granted without a toast storm. */
  const silentRef = useRef(true);

  // ---------------------------------------------------------------- server sync

  const pullFromServer = useCallback(async (local: Progress): Promise<Progress> => {
    setSync('syncing');
    const r = await api.getProgress();
    if (!r.ok) {
      setSync(r.status === 0 ? 'offline' : 'error');
      return local;
    }
    const serverAt = r.data.updatedAt || 0;
    const localAt = local.updatedAt || 0;
    if (r.data.progress && serverAt >= localAt) {
      const merged = normalizeProgress(r.data.progress);
      merged.updatedAt = serverAt;
      saveProgress(merged);
      setSync('synced');
      return merged;
    }
    if (hasContent(local)) {
      const push = await api.putProgress(local, localAt || Date.now());
      setSync(push.ok ? 'synced' : push.status === 0 ? 'offline' : 'error');
    } else {
      setSync('synced');
    }
    return local;
  }, []);

  const pushToServer = useCallback(async (p: Progress) => {
    if (!userRef.current) return;
    setSync('syncing');
    const r = await api.putProgress(p, p.updatedAt || Date.now());
    if (!r.ok) {
      setSync(r.status === 0 ? 'offline' : 'error');
      return;
    }
    if (!r.data.stored && r.data.progress) {
      // Server copy was newer (edited elsewhere): adopt it.
      const merged = normalizeProgress(r.data.progress);
      merged.updatedAt = r.data.updatedAt;
      silentRef.current = true;
      setProgress(merged);
    }
    setSync('synced');
  }, []);

  // ---------------------------------------------------------------- boot

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = apiAvailable() ? await api.getAuth() : null;
      if (!alive) return;
      if (saved?.token && saved.user) {
        setToken(saved.token);
        setStorageScope(`u_${saved.user.id}`);
        const local = loadProgress();
        silentRef.current = true;
        setProgress(local);
        setUser(saved.user);
        setBooted(true);
        const merged = await pullFromServer(local);
        if (alive) {
          silentRef.current = true;
          setProgress(merged);
        }
        return;
      }
      setStorageScope('v1');
      silentRef.current = true;
      setProgress(loadProgress());
      const guestChosen = (() => {
        try {
          return localStorage.getItem(GUEST_FLAG) === '1';
        } catch {
          return false;
        }
      })();
      setShowLogin(apiAvailable() && !guestChosen);
      setBooted(true);
    })();
    return () => {
      alive = false;
    };
  }, [pullFromServer]);

  // Persist locally on every change; push to the server with a delay.
  useEffect(() => {
    if (!booted) return;
    saveProgress(progress);
    if (!user) return;
    if (pushTimer.current !== null) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => void pushToServer(progress), PUSH_DELAY_MS);
    return () => {
      if (pushTimer.current !== null) window.clearTimeout(pushTimer.current);
    };
  }, [progress, booted, user, pushToServer]);

  // Achievements and daily-quest bonus: evaluated after every change.
  useEffect(() => {
    if (!booted) return;
    const r = applyRewards(progress);
    const silent = silentRef.current;
    silentRef.current = false;
    if (r.progress === progress) return;
    setProgress(r.progress);
    if (silent) return;
    const items: ToastItem[] = [];
    if (r.questBonus) items.push({ id: uid(), emoji: '🎯', title: 'Все задания дня выполнены!', desc: `+${QUEST_BONUS} XP бонусом` });
    if (r.unlocked.length > 3) {
      items.push({ id: uid(), emoji: '🏅', title: `Открыто достижений: ${r.unlocked.length}`, desc: 'Посмотрите их в разделе «Достижения»' });
    } else {
      r.unlocked.forEach((id) => {
        const a = achievementById(id);
        if (a) items.push({ id: uid(), emoji: a.emoji, title: `Достижение: ${a.title}`, desc: a.desc });
      });
    }
    if (items.length) {
      setToasts((t) => [...t, ...items]);
      if (progress.settings.sounds) playSfx('level');
    }
  }, [progress, booted]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => ({ ...fn(p), updatedAt: Date.now() })), []);
  const ctx = useMemo(() => ({ progress, update }), [progress, update]);
  const closeToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Daily login reward: the first time the app is opened on a day, that day is recorded and crystals are granted.
  useEffect(() => {
    if (!booted || showLogin) return;
    const today = dateKey();
    if ((progress.logins ?? []).includes(today)) return;
    const info = loginInfo(progress, today);
    update((p) => ((p.logins ?? []).includes(today) ? p : { ...p, logins: [...(p.logins ?? []), today] }));
    setToasts((t) => [
      ...t,
      { id: uid(), emoji: '📅', title: `Ежедневный бонус: +${info.reward} 💎`, desc: info.day > 1 ? `День ${info.day} подряд. Заходите завтра за следующей наградой!` : 'Заходите каждый день: награда растёт до +5 💎' },
    ]);
  }, [progress, booted, showLogin, update]);

  // ---------------------------------------------------------------- auth actions

  const onLoggedIn = async ({ token, user: u, isNew }: { token: string; user: ApiUser; progressUpdatedAt: number; isNew: boolean }) => {
    const guest = hasStoredProgress(LEGACY_KEY) ? loadProgress(LEGACY_KEY) : null;
    setToken(token);
    await api.setAuth({ token, user: u });
    setStorageScope(`u_${u.id}`);
    let local = loadProgress();
    if (!hasContent(local) && guest && hasContent(guest)) {
      // First login on this computer: carry the guest progress into the account.
      local = { ...guest, updatedAt: Date.now() };
      if (local.settings.name === 'Ученик') local.settings.name = u.login;
      saveProgress(local);
    } else if (isNew && !hasContent(local)) {
      local = { ...local, settings: { ...local.settings, name: u.login }, updatedAt: Date.now() };
      saveProgress(local);
    }
    setUser(u);
    setShowLogin(false);
    setScreen({ name: 'home' });
    silentRef.current = true;
    setProgress(local);
    const merged = await pullFromServer(local);
    silentRef.current = true;
    setProgress(merged);
  };

  const onGuest = () => {
    try {
      localStorage.setItem(GUEST_FLAG, '1');
    } catch {
      // ignore
    }
    setShowLogin(false);
  };

  const logout = async () => {
    if (pushTimer.current !== null) window.clearTimeout(pushTimer.current);
    if (user) await pushToServer(progress);
    await api.clearAuth();
    setToken('');
    setUser(null);
    setSync('idle');
    setStorageScope('v1');
    silentRef.current = true;
    setProgress(loadProgress());
    setScreen({ name: 'home' });
    setShowLogin(true);
  };

  const authCtx = useMemo(
    () => ({
      user,
      sync,
      openLogin: () => setShowLogin(true),
      logout,
      syncNow: async () => pushToServer(progress),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, sync, progress],
  );

  if (!booted) return <div className="boot" />;

  if (showLogin) {
    return (
      <AuthContext.Provider value={authCtx}>
        <LoginScreen onLoggedIn={(d) => void onLoggedIn(d)} onGuest={onGuest} hasLocalProgress={hasStoredProgress(LEGACY_KEY) && hasContent(loadProgress(LEGACY_KEY))} />
      </AuthContext.Provider>
    );
  }

  const inLesson = screen.name === 'lesson' || screen.name === 'endless';
  const dueCount = dueWords(progress.words, Date.now()).length;

  return (
    <AuthContext.Provider value={authCtx}>
      <ProgressContext.Provider value={ctx}>
        <div className={'app' + (inLesson ? ' app-session' : '')}>
          {!inLesson && (
            <Sidebar
              current={screen.name as NavName}
              onNavigate={(name) => setScreen({ name })}
              dueCount={dueCount}
              streak={streakDays(progress.days)}
              xp={progress.xp}
            />
          )}
          <div className="content">
            {screen.name === 'home' && (
              <Home
                onOpenLesson={(id) => setScreen({ name: 'lesson', lessonId: id })}
                onEndless={(id) => setScreen({ name: 'endless', moduleId: id })}
                onReview={() => setScreen({ name: 'review' })}
                onAchievements={() => setScreen({ name: 'achievements' })}
                onGacha={() => setScreen({ name: 'gacha' })}
              />
            )}
            {screen.name === 'lesson' && <LessonScreen key={screen.lessonId} lessonId={screen.lessonId} onExit={() => setScreen({ name: 'home' })} />}
            {screen.name === 'endless' && <EndlessScreen key={screen.moduleId} moduleId={screen.moduleId} onExit={() => setScreen({ name: 'home' })} />}
            {screen.name === 'review' && <ReviewScreen onGoHome={() => setScreen({ name: 'home' })} />}
            {screen.name === 'dictionary' && <Dictionary />}
            {screen.name === 'sounds' && <SoundsScreen />}
            {screen.name === 'twisters' && <TwistersScreen />}
            {screen.name === 'songs' && <SongsScreen />}
            {screen.name === 'tales' && <TalesScreen />}
            {screen.name === 'test' && <TestScreen />}
            {screen.name === 'profile' && <Profile />}
            {screen.name === 'achievements' && <AchievementsScreen />}
            {screen.name === 'gacha' && <ArcadeScreen />}
            {screen.name === 'settings' && <SettingsScreen />}
          </div>
        </div>
        <ToastStack items={toasts} onClose={closeToast} />
      </ProgressContext.Provider>
    </AuthContext.Provider>
  );
}
