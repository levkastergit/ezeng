import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { activeLine, fmtTime } from '../lib/karaoke';
import type { KLine, KWord } from '../lib/karaoke';
import { lookupWord } from '../lib/dict';
import type { DictHit } from '../lib/dict';
import { useProgress } from '../lib/progressContext';
import { initWord } from '../lib/srs';
import { speak } from '../lib/tts';
import { IconPlay, IconSpeaker, IconStop } from './Icons';

interface Props {
  src: string;
  lines: KLine[];
  /** Seconds between lyric time and audio time (audio = lyric + offset). */
  offset?: number;
  /** When given, the sync controls are shown. */
  onOffset?: (offset: number) => void;
  onEnded?: () => void;
  /** Extra controls rendered under the player. */
  footer?: ReactNode;
  /** Short note shown when part of the text has no timing. */
  untimedNote?: string;
}

const RATES = [1, 0.85, 0.7];

/** Audio player with karaoke lyrics: the line being sung is enlarged and its words light up in time. */
export function KaraokePlayer({ src, lines, offset = 0, onOffset, onEnded, footer, untimedNote }: Props) {
  const { progress, update } = useProgress();
  const audioRef = useRef<HTMLAudioElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [showRu, setShowRu] = useState(true);
  const [picked, setPicked] = useState<{ word: KWord; hit: DictHit | null } | null>(null);
  const [error, setError] = useState('');

  const lyricTime = now - offset;
  const active = useMemo(() => activeLine(lines, lyricTime), [lines, lyricTime]);
  const timedCount = useMemo(() => lines.filter((l) => l.timed).length, [lines]);

  // Smooth clock while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      if (a) setNow(a.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Keep the active line in the middle of the lyrics box.
  useEffect(() => {
    const box = boxRef.current;
    const el = active >= 0 ? lineRefs.current[active] : null;
    if (!box || !el) return;
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch((e: Error) => setError(e.message));
    else a.pause();
  }, []);

  const seekLyric = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a || !Number.isFinite(t)) return;
      a.currentTime = Math.max(0, t + offset - 0.15);
      setNow(a.currentTime);
      if (a.paused) void a.play().catch(() => undefined);
    },
    [offset],
  );

  const step = useCallback(
    (dir: -1 | 1) => {
      const timed = lines.map((l, k) => (l.timed ? k : -1)).filter((k) => k >= 0);
      if (!timed.length) return;
      const pos = timed.indexOf(active);
      const target = pos < 0 ? timed[0] : timed[Math.min(timed.length - 1, Math.max(0, pos + dir))];
      seekLyric(lines[target].t);
    },
    [lines, active, seekLyric],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, step]);

  const pickWord = (word: KWord) => setPicked({ word, hit: lookupWord(word.w) });

  const addToReview = (hit: DictHit) =>
    update((p) => (p.words[hit.key] ? p : { ...p, words: { ...p.words, [hit.key]: initWord(hit.key, hit.lessonId, hit.word.en, Date.now()) } }));

  const firstTimed = lines.find((l) => l.timed);

  return (
    <div className="karaoke">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => !playing && setNow(e.currentTarget.currentTime)}
        onSeeked={(e) => setNow(e.currentTarget.currentTime)}
        onError={() => setError('Не удалось открыть аудиофайл.')}
      />

      <div className="kp-bar">
        <button className="kp-play" onClick={toggle} aria-label={playing ? 'Пауза' : 'Играть'}>
          {playing ? <IconStop size={22} /> : <IconPlay size={22} />}
        </button>
        <span className="kp-time">{fmtTime(now)}</span>
        <input
          className="kp-seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(now, duration || 0)}
          onChange={(e) => {
            const a = audioRef.current;
            if (!a) return;
            a.currentTime = Number(e.target.value);
            setNow(a.currentTime);
          }}
        />
        <span className="kp-time">{fmtTime(duration)}</span>
        <div className="seg kp-rate" title="Скорость: медленнее, чтобы успевать читать">
          {RATES.map((r) => (
            <button key={r} className={'seg-btn' + (rate === r ? ' active' : '')} onClick={() => setRate(r)}>
              ×{r}
            </button>
          ))}
        </div>
      </div>

      <div className="kp-tools">
        <button className="chip-btn" onClick={() => step(-1)} title="Предыдущая строка (←)">
          ⏮ строка
        </button>
        <button className="chip-btn" onClick={() => active >= 0 && seekLyric(lines[active].t)} title="Повторить текущую строку">
          ⟲ повторить строку
        </button>
        <button className="chip-btn" onClick={() => step(1)} title="Следующая строка (→)">
          строка ⏭
        </button>
        <button className={'toggle' + (showRu ? ' on' : '')} onClick={() => setShowRu((v) => !v)}>
          Перевод
        </button>
        <span className="muted small kp-keys">Пробел — пауза, ← → — строки, клик по слову — перевод</span>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="kp-lyrics" ref={boxRef}>
        <div className="kp-pad" />
        {lines.map((l, k) => {
          const state = !l.timed ? 'untimed' : k === active ? 'active' : k < active ? 'past' : 'future';
          return (
            <div
              key={k}
              ref={(el) => {
                lineRefs.current[k] = el;
              }}
              className={'kp-line ' + state}
            >
              <div className="kp-text">
                {l.words.map((w, j) => {
                  let cls = 'kw';
                  let style: CSSProperties | undefined;
                  if (l.timed) {
                    if (lyricTime >= w.e) cls += ' done';
                    else if (lyricTime >= w.s) {
                      cls += ' now';
                      style = { '--p': `${Math.round(((lyricTime - w.s) / Math.max(0.05, w.e - w.s)) * 100)}%` } as CSSProperties;
                    }
                  }
                  return (
                    <span key={j} className={cls} style={style} onClick={() => pickWord(w)}>
                      {w.w}{' '}
                    </span>
                  );
                })}
              </div>
              {showRu && l.ru && <div className="kp-ru">{l.ru}</div>}
            </div>
          );
        })}
        <div className="kp-pad" />
      </div>

      {timedCount < lines.length && untimedNote && <p className="muted small">{untimedNote}</p>}

      {picked && (
        <div className="kp-word">
          <div className="kp-word-main">
            <b>{picked.word.w.replace(/[^\p{L}'’-]/gu, '')}</b>
            {picked.hit ? (
              <>
                {picked.hit.word.cy && <span className="cy-pill">{picked.hit.word.cy}</span>}
                <span className="muted">{picked.hit.word.ipa}</span>
                <span>— {picked.hit.word.ru}</span>
              </>
            ) : (
              <span className="muted">— этого слова пока нет в словаре курса</span>
            )}
          </div>
          <div className="btn-row left">
            {picked.hit && (
              <button className="chip-btn" onClick={() => speak(picked.hit!.word.en, progress.settings)}>
                <IconSpeaker size={14} /> Озвучить
              </button>
            )}
            {picked.hit && (
              <button className="chip-btn" disabled={!!progress.words[picked.hit.key]} onClick={() => addToReview(picked.hit!)}>
                {progress.words[picked.hit.key] ? 'Уже в повторении' : '+ В повторение'}
              </button>
            )}
            {Number.isFinite(picked.word.s) && (
              <button className="chip-btn" onClick={() => seekLyric(picked.word.s)}>
                ▶ Отсюда
              </button>
            )}
            <button className="chip-btn" onClick={() => setPicked(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {onOffset && (
        <div className="kp-sync">
          <span>
            Сдвиг текста: <b>{offset >= 0 ? '+' : ''}{offset.toFixed(1)} с</b>
          </span>
          <button className="chip-btn" onClick={() => onOffset(Math.round((offset - 0.5) * 10) / 10)}>
            −0.5
          </button>
          <button className="chip-btn" onClick={() => onOffset(Math.round((offset - 0.1) * 10) / 10)}>
            −0.1
          </button>
          <button className="chip-btn" onClick={() => onOffset(Math.round((offset + 0.1) * 10) / 10)}>
            +0.1
          </button>
          <button className="chip-btn" onClick={() => onOffset(Math.round((offset + 0.5) * 10) / 10)}>
            +0.5
          </button>
          {firstTimed && (
            <button
              className="chip-btn accent"
              title="Нажмите в момент, когда в песне начинается первая строка текста"
              onClick={() => {
                const a = audioRef.current;
                if (a) onOffset(Math.round((a.currentTime - firstTimed.t) * 10) / 10);
              }}
            >
              Первая строка началась сейчас
            </button>
          )}
          <span className="muted small">Если текст спешит, добавьте сдвиг (+); если отстаёт, уменьшите (−).</span>
        </div>
      )}

      {footer}
    </div>
  );
}
