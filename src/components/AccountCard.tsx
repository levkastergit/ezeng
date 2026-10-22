import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Button } from './Button';

const SYNC_TEXT: Record<string, string> = {
  idle: 'не синхронизировано',
  syncing: 'синхронизация…',
  synced: 'прогресс сохранён на сервере',
  offline: 'сервер недоступен, прогресс сохранён локально и отправится позже',
  error: 'ошибка синхронизации, попробуйте позже',
};

export function AccountCard() {
  const { user, sync, openLogin, logout, syncNow } = useAuth();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [changing, setChanging] = useState(false);
  const [showLb, setShowLb] = useState(user?.showInLeaderboard ?? true);

  if (!user) {
    return (
      <div className="card">
        <h3>Аккаунт</h3>
        <p className="muted">Вы занимаетесь без аккаунта: прогресс хранится только на этом компьютере.</p>
        <Button onClick={openLogin}>Войти или создать аккаунт</Button>
      </div>
    );
  }

  const changePassword = async () => {
    setMsg('');
    if (newPw.length < 6) {
      setMsg('Новый пароль: не меньше 6 символов');
      return;
    }
    const r = await api.changePassword(oldPw, newPw);
    if (r.ok) {
      await api.setAuth({ token: r.data.token, user });
      setMsg('Пароль изменён');
      setOldPw('');
      setNewPw('');
      setChanging(false);
    } else {
      setMsg(r.error);
    }
  };

  const toggleLb = async (show: boolean) => {
    setShowLb(show);
    const r = await api.setLeaderboardVisibility(show);
    if (r.ok) await api.setAuth({ token: (await api.getAuth())?.token ?? '', user: { ...user, showInLeaderboard: show } });
  };

  return (
    <div className="card">
      <h3>Аккаунт</h3>
      <div className="account-row">
        <div>
          <div className="account-login">{user.login}</div>
          <div className="muted">
            <span className={'sync-dot ' + sync} /> {SYNC_TEXT[sync]}
          </div>
        </div>
        <div className="btn-row">
          <Button variant="secondary" onClick={() => void syncNow()}>
            Синхронизировать
          </Button>
          <Button variant="ghost" onClick={() => void logout()}>
            Выйти
          </Button>
        </div>
      </div>
      <label className="field field-row">
        <input type="checkbox" checked={showLb} onChange={(e) => void toggleLb(e.target.checked)} />
        <span>Показывать меня в таблице лидеров</span>
      </label>
      {changing ? (
        <div className="pw-form">
          <label className="field">
            <span>Текущий пароль</span>
            <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          </label>
          <label className="field">
            <span>Новый пароль</span>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </label>
          <div className="btn-row left">
            <Button onClick={() => void changePassword()}>Сохранить пароль</Button>
            <Button variant="ghost" onClick={() => setChanging(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setChanging(true)}>
          Сменить пароль
        </Button>
      )}
      {msg && <p className="muted" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
