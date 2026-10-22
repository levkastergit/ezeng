import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { checkForUpdates, downloadUpdate, installUpdate, openReleasesPage, useUpdateState } from '../lib/updater';

interface Props {
  /** Compact banner for the home screen; otherwise the full settings card. */
  compact?: boolean;
}

export function UpdatePanel({ compact = false }: Props) {
  const s = useUpdateState();

  if (compact) {
    if (s.phase !== 'available' && s.phase !== 'downloading' && s.phase !== 'downloaded') return null;
    return (
      <div className="update-banner">
        <div className="update-banner-text">
          {s.phase === 'available' && (
            <>
              <b>Доступна версия {s.version}</b>
              <span>Можно обновиться прямо из приложения.</span>
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
      body = <p className="muted">Нажмите кнопку, чтобы проверить наличие новой версии на GitHub.</p>;
      break;
    case 'checking':
      body = <p className="muted">Проверяем…</p>;
      break;
    case 'none':
      body = <p className="update-ok">У вас последняя версия ({s.latest}).</p>;
      break;
    case 'available':
      body = (
        <p>
          <b>Доступна версия {s.version}.</b> Установщик будет загружен с GitHub, затем приложение перезапустится.
        </p>
      );
      break;
    case 'downloading':
      body = (
        <div>
          <p className="muted">Загрузка версии {s.version}: {Math.round(s.percent)}%</p>
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
      body = (
        <p className="muted">
          {s.reason === 'portable'
            ? 'Это портативная версия: она не обновляется автоматически. Скачайте новую версию со страницы релизов.'
            : s.reason === 'browser'
              ? 'Обновления работают только в установленном приложении.'
              : 'Автообновление доступно только в установленной версии (EzEng-Setup). Новую версию можно скачать со страницы релизов.'}
        </p>
      );
      break;
    case 'error':
      body = (
        <p className="update-error">
          Не удалось проверить обновления: {s.message}. Проверьте подключение к интернету или скачайте версию вручную.
        </p>
      );
      break;
  }

  const busy = s.phase === 'checking' || s.phase === 'downloading';

  return (
    <div className="update-panel">
      {body}
      <div className="btn-row left">
        {s.phase === 'available' && <Button onClick={() => void downloadUpdate()}>Скачать и установить</Button>}
        {s.phase === 'downloaded' && (
          <Button variant="success" onClick={installUpdate}>
            Перезапустить и установить
          </Button>
        )}
        {s.phase !== 'available' && s.phase !== 'downloaded' && (
          <Button variant={s.phase === 'unsupported' ? 'secondary' : 'primary'} disabled={busy} onClick={() => void checkForUpdates()}>
            {s.phase === 'checking' ? 'Проверяем…' : 'Проверить обновления'}
          </Button>
        )}
        <Button variant="ghost" onClick={openReleasesPage}>
          Страница релизов
        </Button>
      </div>
    </div>
  );
}
