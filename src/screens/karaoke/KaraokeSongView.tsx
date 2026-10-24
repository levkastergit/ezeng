import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../../lib/progressContext';
import { audioExt, buildUserTimeline, karaokeBridge, userMediaUrl } from '../../lib/karaoke';
import { bumpDaily } from '../../lib/storage';
import { KaraokePlayer } from '../../components/KaraokePlayer';
import { Button } from '../../components/Button';
import { IconArrowLeft } from '../../components/Icons';

interface Props {
  songId: string;
  onBack: () => void;
  onSync: () => void;
}

export function KaraokeSongView({ songId, onBack, onSync }: Props) {
  const { progress, update } = useProgress();
  const bridge = karaokeBridge();
  const song = (progress.karaoke ?? []).find((s) => s.id === songId);
  const [file, setFile] = useState<string | null | undefined>(undefined);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bridge) return;
    void bridge.file(songId).then(setFile);
  }, [bridge, songId, version]);

  const lines = useMemo(() => (song ? buildUserTimeline(song.lines, song.duration) : []), [song]);

  if (!song) {
    return (
      <div className="page">
        <button className="back-link" onClick={onBack}>
          <IconArrowLeft size={18} /> Песни
        </button>
        <p className="muted">Песня не найдена.</p>
      </div>
    );
  }

  const attach = async (f: File | undefined) => {
    if (!f || !bridge) return;
    const ext = audioExt(f.name);
    if (!ext) {
      setError('Поддерживаются файлы mp3, m4a, aac, ogg, opus, wav, flac, webm.');
      return;
    }
    const r = await bridge.save(songId, ext, await f.arrayBuffer());
    if (!r.ok) setError(`Не удалось сохранить файл: ${r.error}`);
    else setVersion((v) => v + 1);
  };

  const remove = async () => {
    if (!window.confirm(`Удалить «${song.title}» из караоке?`)) return;
    await bridge?.remove(songId);
    update((p) => ({ ...p, karaoke: (p.karaoke ?? []).filter((s) => s.id !== songId) }));
    onBack();
  };

  const setOffset = (offset: number) => update((p) => ({ ...p, karaoke: (p.karaoke ?? []).map((s) => (s.id === songId ? { ...s, offset } : s)) }));

  const timed = lines.some((l) => l.timed);

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <IconArrowLeft size={18} /> Песни
      </button>
      <div className="song-head">
        <div>
          <h1>{song.title}</h1>
          <p className="muted">
            {song.artist || 'Исполнитель не указан'} · караоке
            {song.source === 'lrclib' ? ' · текст: LRCLIB' : song.source === 'lrc' ? ' · текст из файла' : ''}
          </p>
        </div>
      </div>

      {file === null && (
        <div className="card">
          <h3>Нет аудиофайла на этом компьютере</h3>
          <p className="muted">Текст и тайминги сохранены в аккаунте, а сам файл песни хранится только там, где его добавили. Выберите файл этой песни, чтобы включить караоке здесь.</p>
          <label className="btn btn-primary btn-md file-btn">
            Выбрать файл песни
            <input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.webm" onChange={(e) => void attach(e.target.files?.[0])} />
          </label>
        </div>
      )}

      {error && <div className="login-error">{error}</div>}

      {file && !timed && (
        <div className="card">
          <h3>Текст ещё не синхронизирован</h3>
          <p className="muted">У этого текста нет меток времени. Включите песню и нажимайте пробел в начале каждой строки: это займёт одно прослушивание.</p>
          <Button onClick={onSync}>Синхронизировать</Button>
        </div>
      )}

      {file && (
        <KaraokePlayer
          key={`${file}-${version}`}
          src={`${userMediaUrl(file)}?v=${version}`}
          lines={lines}
          offset={song.offset}
          onOffset={setOffset}
          onEnded={() => update((p) => bumpDaily(p, { karaoke: 1 }))}
          untimedNote="Строки без подсветки не имеют меток времени: синхронизируйте их вручную."
        />
      )}

      <div className="btn-row left" style={{ marginTop: 16 }}>
        {file && (
          <Button variant="secondary" onClick={onSync}>
            Синхронизировать вручную
          </Button>
        )}
        {file && (
          <label className="btn btn-secondary btn-md file-btn">
            Заменить аудиофайл
            <input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.webm" onChange={(e) => void attach(e.target.files?.[0])} />
          </label>
        )}
        <Button variant="danger" onClick={() => void remove()}>
          Удалить
        </Button>
      </div>
    </div>
  );
}
