import { useCallback, useEffect, useRef, useState } from 'react';
import { useProgress } from '../../lib/progressContext';
import { fmtTime, karaokeBridge, userMediaUrl } from '../../lib/karaoke';
import { Button } from '../../components/Button';
import { IconArrowLeft } from '../../components/Icons';

interface Props {
  songId: string;
  onDone: () => void;
}

/** Manual sync: while the song plays, the user presses Space at the start of every line. */
export function KaraokeSync({ songId, onDone }: Props) {
  const { progress, update } = useProgress();
  const bridge = karaokeBridge();
  const song = (progress.karaoke ?? []).find((s) => s.id === songId);
  const textIdx = (song?.lines ?? []).map((l, i) => (l.text ? i : -1)).filter((i) => i >= 0);
  const [file, setFile] = useState<string | null>(null);
  const [times, setTimes] = useState<(number | null)[]>(() => textIdx.map(() => null));
  const [cursor, setCursor] = useState(0);
  const [now, setNow] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bridge) void bridge.file(songId).then(setFile);
  }, [bridge, songId]);

  useEffect(() => {
    const t = window.setInterval(() => audioRef.current && setNow(audioRef.current.currentTime), 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const box = listRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-k="${cursor}"]`);
    // Scroll only the list (scrollIntoView would also shift the whole app window).
    if (box && el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [cursor]);

  const mark = useCallback(() => {
    const a = audioRef.current;
    if (!a || cursor >= textIdx.length) return;
    if (a.paused) void a.play();
    const t = a.currentTime;
    setTimes((ts) => ts.map((x, k) => (k === cursor ? t : x)));
    setCursor((c) => c + 1);
  }, [cursor, textIdx.length]);

  const undo = useCallback(() => {
    if (cursor === 0) return;
    const prev = cursor - 1;
    const a = audioRef.current;
    const back = times[prev];
    setTimes((ts) => ts.map((x, k) => (k >= prev ? null : x)));
    setCursor(prev);
    if (a && back !== null) a.currentTime = Math.max(0, back - 3);
  }, [cursor, times]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        mark();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mark, undo]);

  if (!song) return null;

  const save = () => {
    const lines = song.lines.map((l, i) => {
      const k = textIdx.indexOf(i);
      return k >= 0 ? { t: times[k], text: l.text, ru: l.ru } : { ...l, t: null };
    });
    update((p) => ({ ...p, karaoke: (p.karaoke ?? []).map((s) => (s.id === songId ? { ...s, lines, offset: 0 } : s)) }));
    onDone();
  };

  const done = times.filter((t) => t !== null).length;

  return (
    <div className="page page-narrow">
      <button className="back-link" onClick={onDone}>
        <IconArrowLeft size={18} /> Назад к песне
      </button>
      <div className="page-head">
        <h1>Синхронизация текста</h1>
        <p>
          Включите песню и нажимайте <b>пробел</b> (или кнопку) в тот момент, когда начинается выделенная строка. <b>Backspace</b> отменяет последнюю метку и отматывает песню на 3 секунды назад.
        </p>
      </div>

      {file ? <audio ref={audioRef} src={userMediaUrl(file)} controls className="sync-audio" /> : <p className="muted">Аудиофайл не найден на этом компьютере.</p>}

      <div className="sync-bar">
        <Button size="lg" onClick={mark} disabled={!file || cursor >= textIdx.length}>
          Строка началась · {fmtTime(now)}
        </Button>
        <Button variant="secondary" onClick={undo} disabled={cursor === 0}>
          Отменить
        </Button>
        <span className="muted">
          Отмечено {done} из {textIdx.length}
        </span>
      </div>

      <div className="card sync-list" ref={listRef}>
        {textIdx.map((i, k) => (
          <div key={i} data-k={k} className={'sync-line' + (k === cursor ? ' now' : times[k] !== null ? ' done' : '')}>
            <span className="sync-time">{times[k] !== null ? fmtTime(times[k]!) : '—'}</span>
            <span>{song.lines[i].text}</span>
          </div>
        ))}
      </div>

      <div className="btn-row left">
        <Button size="lg" onClick={save} disabled={done === 0}>
          Сохранить{done < textIdx.length ? ` (${done} из ${textIdx.length})` : ''}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setTimes(textIdx.map(() => null));
            setCursor(0);
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
        >
          Начать заново
        </Button>
      </div>
    </div>
  );
}
