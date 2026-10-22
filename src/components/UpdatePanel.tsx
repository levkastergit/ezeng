import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  openReleasesPage,
  openUpdateLog,
  useUpdateState,
} from '../lib/updater';

interface Props {
  /** Compact banner for the home screen; otherwise the full settings card. */
  compact?: boolean;
}

const REASON_TEXT: Record<string, string> = {
  portable: 'Это портативная версия: она не обновляется автоматически. Скачайте новый файл со страницы релизов.',
  dev: 'Это сборка для разработки, автообновление отключено.',
  missing: 'Модуль обновлений недоступен в этой сборке.',
  browser: 'Обновления работают только в установленном приложении.',
};

export function UpdatePanel({ compact = false }: Props) {
  const s = useUpdateState();

  if (compact) {
    if (s.phase !== 'available' && s.phase !== 'manual' && s.phase !== 'downloading' && s.phase !== 'downloaded') return null;
    return (
      <div className="update-banner">
        <div className="update-banner-text">
          {s.phase === 'available' && (
            <>
              <b>Доступна версия {s.version}</b>
              <span>Можно обновиться прямо из приложения.</span>
            </>
          )}
          {s.phase === 'manual' && (
            <>
              <b>Доступна версия {s.version}</b>
              <span>Скачайте новую версию со страницы релизов.</span>
            </>
          )}
          {s.phase === 'downloading' && (
            <>
              <b>Загрузка версии {s.version}…</b>
              <ProgressBar value={s.percent / 100} height={8} color="#fff" className="update-banner-bar" />
            </>
          )}
          {s.phase === 'downloaded' && (
            <>
              <b>Версия {s.version} загружена</b>
              <span>Перезапустите приложение, чтобы установить.</span>
            </>
          )}
        </div>
        {s.phase === 'available' && (
          <Button variant="secondary" onClick={() => void downloadUpdate()}>
            Обновить
          </Button>
        )}
        {s.phase === 'manual' && (
          <Button variant="secondary" onClick={openReleasesPage}>
            Скачать
          </Button>
        )}
        {s.phase === 'downloaded' && (
          <Button variant="secondary" onClick={installUpdate}>
            Перезапустить
          </Button>
        )}
      </div>
    );
  }

  let body;
  switch (s.phase) {
    case 'idle':
      body = (
        <p className="muted">
          Текущая версия {__APP_VERSION__}. Нажмите кнопку, чтобы узнать, есть ли новая версия на GitHub.
        </p>
      );
      break;
    case 'checking':
      body = <p className="muted">Проверяем на GitHub… Обычно это занимает пару секунд.</p>;
      break;
    case 'none':
      body = (
        <p className="update-ok">
          У вас последняя версия ({s.latest}).
          {s.reason === 'portable' ? ' Портативная версия обновляется вручную, когда выйдет новая.' : ''}
        </p>
      );
      break;
    case 'available':
      body = (
        <p>
          <b>Доступна версия {s.version}.</b> Установщик будет загружен с GitHub, затем приложение перезапустится.
        </p>
      );
      break;
    case 'manual':
      body = (
        <p>
          <b>Доступна версия {s.version}.</b> {REASON_TEXT[s.reason]} Скачайте новый файл и запустите его вместо текущего, прогресс обучения сохранится.
        </p>
      );
      break;
    case 'downloading':
      body = (
        <div>
          <p className="muted">
            Загрузка версии {s.version}: {Math.round(s.percent)}%
          </p>
          <ProgressBar value={s.percent / 100} height={10} className="update-bar" />
        </div>
      );
      break;
    case 'downloaded':
      body = (
        <p>
          <b>Версия {s.version} загружена.</b> Нажмите «Перезапустить и установить». Прогресс обучения сохранится.
        </p>
      );
      break;
    case 'unsupported':
      body = <p className="muted">{REASON_TEXT[s.reason]}</p>;
      break;
    case 'error':
      body = (
        <div>
          <p className="update-error">Не удалось проверить обновления: {s.message}.</p>
          <p className="muted">
            Проверьте подключение к интернету или скачайте версию вручную со страницы релизов.
            {s.logPath ? ' Подробности записаны в updater.log.' : ''}
          </p>
        </div>
      );
      break;
  }

  const busy = s.phase === 'checking' || s.phase === 'downloading';

  return (
    <div className="update-panel">
      {body}
      <div className="btn-row left">
        {s.phase === 'available' && <Button onClick={() => void downloadUpdate()}>Скачать и установить</Button>}
        {s.phase === 'manual' && <Button onClick={openReleasesPage}>Открыть страницу загрузки</Button>}
        {s.phase === 'downloaded' && (
          <Button variant="success" onClick={installUpdate}>
            Перезапустить и установить
          </Button>
        )}
        {s.phase !== 'available' && s.phase !== 'downloaded' && s.phase !== 'manual' && (
          <Button variant={s.phase === 'unsupported' ? 'secondary' : 'primary'} disabled={busy} onClick={() => void checkForUpdates()}>
            {s.phase === 'checking' ? 'Проверяем…' : s.phase === 'idle' ? 'Проверить обновления' : 'Проверить ещё раз'}
          </Button>
        )}
        <Button variant="ghost" onClick={openReleasesPage}>
          Страница релизов
        </Button>
        {s.phase === 'error' && s.logPath && (
          <Button variant="ghost" onClick={openUpdateLog}>
            Показать лог
          </Button>
        )}
      </div>
    </div>
  );
}
