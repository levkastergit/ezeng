import { useEffect, useState } from 'react';
import { api, apiAvailable } from '../lib/api';
import type { ApiUser } from '../lib/api';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';

interface Props {
  onLoggedIn: (data: { token: string; user: ApiUser; progressUpdatedAt: number; isNew: boolean }) => void;
  onGuest: () => void;
  /** True when a guest profile with progress exists locally. */
  hasLocalProgress: boolean;
}

export function LoginScreen({ onLoggedIn, onGuest, hasLocalProgress }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    if (!apiAvailable()) {
      setOnline(false);
      return;
    }
    void api.health().then((r) => alive && setOnline(r.ok));
    return () => {
      alive = false;
    };
  }, []);

  const submit = async () => {
    setError('');
    if (mode === 'register' && password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    const r = mode === 'login' ? await api.login(login.trim(), password) : await api.register(login.trim(), password);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    const progressUpdatedAt = r.data.progressUpdatedAt ?? 0;
    onLoggedIn({ token: r.data.token, user: r.data.user, progressUpdatedAt, isNew: mode === 'register' });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <Mascot size={110} mood="happy" />
        <h1>EzEng</h1>
        <p className="muted">
          Аккаунт хранит прогресс, достижения и место в таблице лидеров на сервере, чтобы продолжать на любом компьютере.
        </p>
        <div className="tabs login-tabs">
          <button className={'tab' + (mode === 'login' ? ' active' : '')} onClick={() => setMode('login')}>
            Войти
          </button>
          <button className={'tab' + (mode === 'register' ? ' active' : '')} onClick={() => setMode('register')}>
            Создать аккаунт
          </button>
        </div>
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="field">
            <span>Логин</span>
            <input value={login} onChange={(e) => setLogin(e.target.value)} autoFocus autoComplete="username" placeholder="латинские буквы, цифры, _ . -" maxLength={24} />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="не меньше 6 символов" />
          </label>
          {mode === 'register' && (
            <label className="field">
              <span>Повторите пароль</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </label>
          )}
          {error && <div className="login-error">{error}</div>}
          <Button size="lg" type="submit" disabled={busy || !login.trim() || !password || online === false}>
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </form>
        {mode === 'register' && hasLocalProgress && (
          <p className="muted small">Ваш текущий прогресс на этом компьютере будет перенесён в новый аккаунт.</p>
        )}
        <div className="login-status">
          {online === null ? 'Проверяем связь с сервером…' : online ? 'Сервер доступен' : 'Сервер недоступен: можно продолжить без аккаунта, прогресс сохранится на этом компьютере.'}
        </div>
        <button className="link-btn" onClick={onGuest}>
          Продолжить без аккаунта
        </button>
      </div>
    </div>
  );
}
