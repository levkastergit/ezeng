import { useEffect, useRef, useState } from 'react';
import { songs } from '../data/songs';
import type { Song, SongLine } from '../data/songs';
import { songAudio } from '../data/songAudio';
import songKaraoke from '../data/songKaraoke.json';
import { buildBuiltinTimeline } from '../lib/karaoke';
import { bumpDaily } from '../lib/storage';
import { KaraokePlayer } from '../components/KaraokePlayer';
import { KaraokeAdd } from './karaoke/KaraokeAdd';
import { KaraokeSongView } from './karaoke/KaraokeSongView';
import { KaraokeSync } from './karaoke/KaraokeSync';
import { useProgress } from '../lib/progressContext';
import { hasEnglishVoice, speakAsync, stopSpeaking } from '../lib/tts';
import { Button } from '../components/Button';
import { IconArrowLeft, IconMusic, IconPlay, IconSpeaker, IconStop, IconTrash } from '../components/Icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Timing = { coverage: number; lines: Record<string, [number, number][]> };
const TIMINGS = songKaraoke as unknown as Record<string, Timing>;
type KView = { kind: 'add' } | { kind: 'song'; id: string } | { kind: 'sync'; id: string } | null;

export function SongsScreen() {
  const { progress, update } = useProgress();
  const settings = progress.settings;
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showRu, setShowRu] = useState(true);
  const [showCy, setShowCy] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);
  const [mode, setMode] = useState<'karaoke' | 'text'>('karaoke');
  const [kView, setKView] = useState<KView>(null);
  const cancelRef = useRef(false);

  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [trans, setTrans] = useState('');

  useEffect(
    () => () => {
      cancelRef.current = true;
      stopSpeaking();
    },
    [],
  );

  const custom: Song[] = progress.customSongs.map((c) => ({
    id: c.id,
    title: c.title,
    author: 'Моя песня',
    year: '',
    note: '',
    lines: c.lines,
  }));
  const all = [...songs, ...custom];
  const song = all.find((s) => s.id === openId) ?? null;
  const isCustom = song ? custom.some((c) => c.id === song.id) : false;

  const stop = () => {
    cancelRef.current = true;
    stopSpeaking();
    setPlaying(null);
  };

  const playLine = async (lines: SongLine[], i: number) => {
    stop();
    cancelRef.current = false;
    setPlaying(i);
    await speakAsync(lines[i].en, settings);
    setPlaying((p) => (p === i ? null : p));
  };

  const playAll = async (lines: SongLine[]) => {
    stop();
    cancelRef.current = false;
    for (let i = 0; i < lines.length; i++) {
      if (cancelRef.current) return;
      if (!lines[i].en) continue;
      setPlaying(i);
      await speakAsync(lines[i].en, settings);
      if (cancelRef.current) return;
      await sleep(350);
    }
    setPlaying(null);
  };

  const open = (id: string | null) => {
    stop();
    setOpenId(id);
  };

  const saveCustom = () => {
    const en = lyrics.split('\n');
    const ru = trans.split('\n');
    const lines = en.map((l, i) => ({ en: l.trim(), ru: (ru[i] ?? '').trim() }));
    while (lines.length && !lines[lines.length - 1].en) lines.pop();
    if (!title.trim() || lines.every((l) => !l.en)) return;
    const id = `c${Date.now().toString(36)}`;
    update((p) => ({ ...p, customSongs: [...p.customSongs, { id, title: title.trim(), lines, createdAt: Date.now() }] }));
    setTitle('');
    setLyrics('');
    setTrans('');
    setAdding(false);
    setOpenId(id);
  };

  const removeCustom = (id: string) => {
    if (!window.confirm('Удалить эту песню?')) return;
    stop();
    update((p) => ({ ...p, customSongs: p.customSongs.filter((c) => c.id !== id) }));
    setOpenId(null);
  };

  if (kView?.kind === 'add') {
    return <KaraokeAdd onCancel={() => setKView(null)} onDone={(id, needsSync) => setKView({ kind: needsSync ? 'sync' : 'song', id })} />;
  }
  if (kView?.kind === 'song') {
    const id = kView.id;
    return <KaraokeSongView songId={id} onBack={() => setKView(null)} onSync={() => setKView({ kind: 'sync', id })} />;
  }
  if (kView?.kind === 'sync') {
    const id = kView.id;
    return <KaraokeSync songId={id} onDone={() => setKView({ kind: 'song', id })} />;
  }

  if (song) {
    const lines = song.lines;
    const noVoice = isCustom && !hasEnglishVoice();
    const audio = songAudio[song.id];
    const timing = TIMINGS[song.id];
    const kLines = audio && timing && timing.coverage > 0 ? buildBuiltinTimeline(lines, timing.lines) : null;
    const karaokeOn = !!kLines && mode === 'karaoke';
    return (
      <div className="page">
        <button className="back-link" onClick={() => open(null)}>
          <IconArrowLeft size={18} /> Все песни
        </button>
        <div className="song-head">
          <div>
            <h1>{song.title}</h1>
            <p className="muted">
              {song.author}
              {song.year ? ` · ${song.year}` : ''}
            </p>
            {song.note && <p className="song-note">{song.note}</p>}
          </div>
          {isCustom && (
            <button className="icon-btn" title="Удалить" onClick={() => removeCustom(song.id)}>
              <IconTrash size={20} />
            </button>
          )}
        </div>

        {kLines && (
          <div className="tabs song-mode">
            <button
              className={'tab' + (mode === 'karaoke' ? ' active' : '')}
              onClick={() => {
                stop();
                setMode('karaoke');
              }}
            >
              🎤 Караоке
            </button>
            <button className={'tab' + (mode === 'text' ? ' active' : '')} onClick={() => setMode('text')}>
              Текст и перевод
            </button>
          </div>
        )}

        {karaokeOn && audio && kLines && (
          <>
            <KaraokePlayer
              src={`${import.meta.env.BASE_URL}songs/${audio.file}`}
              lines={kLines}
              onEnded={() => update((p) => bumpDaily(p, { karaoke: 1 }))}
              untimedNote="Строки без подсветки в этой записи не поются или не распознались, их можно прочитать во вкладке «Текст и перевод»."
            />
            <p className="muted small song-credit">
              Запись: {audio.credit} · {audio.license} ·{' '}
              <a href={audio.source} target="_blank" rel="noreferrer">
                Wikimedia Commons
              </a>
              {audio.note ? ` · ${audio.note}` : ''}
            </p>
          </>
        )}

        {!karaokeOn && audio && (
          <div className="card song-record">
            <div className="song-record-head">
              <IconMusic size={20} className="c-purple" />
              <div>
                <b>Запись песни</b>
                <div className="muted small">
                  {audio.credit} · {audio.license} ·{' '}
                  <a href={audio.source} target="_blank" rel="noreferrer">
                    Wikimedia Commons
                  </a>
                </div>
                {audio.note && <div className="muted small">{audio.note}</div>}
              </div>
            </div>
            <audio controls preload="none" src={`${import.meta.env.BASE_URL}songs/${audio.file}`} onPlay={stop} />
          </div>
        )}

        {!karaokeOn && (
          <>
        <div className="song-controls">
          {playing === null ? (
            <Button variant={audio ? 'secondary' : 'primary'} onClick={() => void playAll(lines)} disabled={noVoice}>
              <IconPlay size={18} /> {audio ? 'Прочитать текст построчно' : 'Слушать всё'}
            </Button>
          ) : (
            <Button variant="danger" onClick={stop}>
              <IconStop size={18} /> Стоп
            </Button>
          )}
          <div className="toggles">
            <button className={'toggle' + (showCy ? ' on' : '')} onClick={() => setShowCy((v) => !v)}>
              Транскрипция
            </button>
            <button className={'toggle' + (showRu ? ' on' : '')} onClick={() => setShowRu((v) => !v)}>
              Перевод
            </button>
          </div>
        </div>
        {noVoice && (
          <p className="muted song-warn">
            Для озвучки своих песен нужен английский голос Windows: Параметры → Время и язык → Речь → Добавить голоса → English (United States).
          </p>
        )}

        <div className="card lyrics">
          {lines.map((l, i) =>
            l.en ? (
              <div key={i} className={'song-line' + (playing === i ? ' playing' : '')}>
                <button className="speaker-btn small" onClick={() => void playLine(lines, i)} disabled={noVoice} aria-label="Прослушать">
                  <IconSpeaker size={16} />
                </button>
                <div className="song-line-text">
                  <div className="song-en">{l.en}</div>
                  {showCy && l.cy && <div className="song-cy">{l.cy}</div>}
                  {showRu && l.ru && <div className="song-ru">{l.ru}</div>}
                </div>
              </div>
            ) : (
              <div key={i} className="song-gap" />
            ),
          )}
        </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Песни</h1>
        <p>
          Известные песни, тексты которых стали общественным достоянием. У каждой есть настоящая запись исполнения (свободные лицензии и общественное достояние, авторы указаны),
          оригинальный текст, построчный перевод, транскрипция и озвучка строк для отработки произношения. Современные хиты защищены авторским правом, поэтому их можно добавить самостоятельно: вставь текст и перевод.
        </p>
      </div>

      <section className="karaoke-section">
        <div className="karaoke-head">
          <div>
            <h2 className="section-title">🎤 Караоке со своими песнями</h2>
            <p className="muted">
              Песни с радио защищены авторским правом, поэтому в приложение они не встроены. Откройте mp3 любимой песни со своего компьютера: текст с таймингом найдётся
              автоматически и будет подсвечиваться по словам, а любое слово можно нажать и посмотреть перевод.
            </p>
          </div>
          <Button onClick={() => setKView({ kind: 'add' })}>+ Добавить песню</Button>
        </div>
        {(progress.karaoke ?? []).length > 0 && (
          <div className="song-grid">
            {(progress.karaoke ?? []).map((k) => (
              <button key={k.id} className="song-card karaoke" onClick={() => setKView({ kind: 'song', id: k.id })}>
                <div className="song-card-icon">🎤</div>
                <div className="song-card-text">
                  <div className="song-card-title">{k.title}</div>
                  <div className="muted">
                    {k.artist || 'исполнитель не указан'} · {k.lines.filter((l) => l.text).length} строк
                    {k.lines.some((l) => l.t !== null) ? '' : ' · нужна синхронизация'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <h2 className="section-title">Классические песни</h2>

      {adding ? (
        <div className="card">
          <h3>Своя песня</h3>
          <label className="field">
            <span>Название</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: My favourite song" maxLength={80} />
          </label>
          <div className="two-col">
            <label className="field">
              <span>Текст на английском (каждая строка с новой строки)</span>
              <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={12} placeholder={'First line\nSecond line'} />
            </label>
            <label className="field">
              <span>Перевод (строки должны совпадать по номерам)</span>
              <textarea value={trans} onChange={(e) => setTrans(e.target.value)} rows={12} placeholder={'Первая строка\nВторая строка'} />
            </label>
          </div>
          <div className="btn-row left">
            <Button onClick={saveCustom} disabled={!title.trim() || !lyrics.trim()}>
              Сохранить
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <button className="quick-card add-song" onClick={() => setAdding(true)}>
          <div className="quick-emoji">＋</div>
          <div className="quick-text">
            <div className="quick-label">Своя песня</div>
            <div className="quick-title">Добавить текст и перевод любой песни</div>
          </div>
        </button>
      )}

      <div className="song-grid">
        {all.map((s) => (
          <button key={s.id} className="song-card" onClick={() => open(s.id)}>
            <div className="song-card-icon">
              <IconMusic size={26} />
            </div>
            <div className="song-card-text">
              <div className="song-card-title">
                {s.title}
                {songAudio[s.id] && <span className="song-badge">{TIMINGS[s.id]?.coverage ? '🎤 караоке' : '🎵 запись'}</span>}
              </div>
              <div className="muted">
                {s.author}
                {s.year ? ` · ${s.year}` : ''} · {s.lines.filter((l) => l.en).length} строк
              </div>
              {s.note && <div className="song-card-note">{s.note}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
