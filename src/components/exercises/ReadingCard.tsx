import { useEffect, useRef, useState } from 'react';
import type { Reading } from '../../data/types';
import type { Settings } from '../../lib/storage';
import { speakAsync, stopSpeaking } from '../../lib/tts';
import { IconPlay, IconSpeaker, IconStop } from '../Icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ReadingCard({ reading, settings }: { reading: Reading; settings: Settings }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [showRu, setShowRu] = useState(false);
  const cancel = useRef(false);

  useEffect(
    () => () => {
      cancel.current = true;
      stopSpeaking();
    },
    [],
  );

  const stop = () => {
    cancel.current = true;
    stopSpeaking();
    setPlaying(null);
  };

  const playAll = async () => {
    stop();
    cancel.current = false;
    for (let i = 0; i < reading.paragraphs.length; i++) {
      if (cancel.current) return;
      setPlaying(i);
      await speakAsync(reading.paragraphs[i].en, settings);
      if (cancel.current) return;
      await sleep(400);
    }
    setPlaying(null);
  };

  const playOne = async (i: number) => {
    stop();
    cancel.current = false;
    setPlaying(i);
    await speakAsync(reading.paragraphs[i].en, settings);
    setPlaying((p) => (p === i ? null : p));
  };

  return (
    <div className="exercise reading-card">
      <div className="pill pill-purple">Текст</div>
      <h2 className="rule-title">{reading.title}</h2>
      <div className="dialogue-controls" style={{ marginBottom: 14 }}>
        {playing === null ? (
          <button className="chip-btn" onClick={() => void playAll()}>
            <IconPlay size={14} /> Слушать текст
          </button>
        ) : (
          <button className="chip-btn" onClick={stop}>
            <IconStop size={14} /> Стоп
          </button>
        )}
        <button className={'toggle' + (showRu ? ' on' : '')} onClick={() => setShowRu((v) => !v)}>
          Перевод
        </button>
      </div>
      <div className="reading-paper">
        {reading.paragraphs.map((p, i) => (
          <div key={i} className={'song-line' + (playing === i ? ' playing' : '')}>
            <button className="speaker-btn small" onClick={() => void playOne(i)} aria-label="Прослушать">
              <IconSpeaker size={16} />
            </button>
            <div className="song-line-text">
              <div className="tale-en">{p.en}</div>
              {showRu && <div className="song-ru">{p.ru}</div>}
            </div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 14 }}>
        Прочитай текст (сначала без перевода), дальше будут вопросы по нему.
      </p>
    </div>
  );
}
