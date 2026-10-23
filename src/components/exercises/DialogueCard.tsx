import { useEffect, useRef, useState } from 'react';
import type { DialogueLine } from '../../data/types';
import type { Settings } from '../../lib/storage';
import { speakAsync, stopSpeaking } from '../../lib/tts';
import { partnerVoice, resolveVoice } from '../../lib/voices';
import type { VoiceDef } from '../../lib/voices';
import { Mascot } from '../Mascot';
import { IconPlay, IconSpeaker, IconStop } from '../Icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  lines: DialogueLine[];
  speakers: { A: string; B: string };
  settings: Settings;
}

export function DialogueCard({ lines, speakers, settings }: Props) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [showRu, setShowRu] = useState(true);
  const cancel = useRef(false);
  // Voices are fixed for the whole dialogue so that each speaker keeps one voice even with the random setting.
  const voiceA = useRef<VoiceDef>(resolveVoice(settings.voice));
  const voiceB = settings.dialogueVoices ? partnerVoice(voiceA.current) : voiceA.current;
  const optsFor = (who: 'A' | 'B') => ({ ...settings, voice: who === 'A' ? voiceA.current.id : voiceB.id });

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
    for (let i = 0; i < lines.length; i++) {
      if (cancel.current) return;
      setPlaying(i);
      await speakAsync(lines[i].en, optsFor(lines[i].who));
      if (cancel.current) return;
      await sleep(350);
    }
    setPlaying(null);
  };

  const playOne = async (i: number) => {
    stop();
    cancel.current = false;
    setPlaying(i);
    await speakAsync(lines[i].en, optsFor(lines[i].who));
    setPlaying((p) => (p === i ? null : p));
  };

  return (
    <div className="exercise dialogue-card">
      <div className="pill pill-purple">Диалог</div>
      <div className="dialogue-head">
        <div className="dialogue-speakers">
          <span className="speaker-tag a">
            <Mascot size={26} mood="happy" shadow={false} /> {speakers.A}
            <small>{voiceA.current.name}</small>
          </span>
          <span className="speaker-tag b">
            <Mascot size={26} mood="wink" shadow={false} /> {speakers.B}
            <small>{voiceB.name}</small>
          </span>
        </div>
        <div className="dialogue-controls">
          {playing === null ? (
            <button className="chip-btn" onClick={() => void playAll()}>
              <IconPlay size={14} /> Слушать весь диалог
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
      </div>
      <div className="dialogue-lines">
        {lines.map((l, i) => (
          <div key={i} className={`dialogue-line ${l.who === 'A' ? 'left' : 'right'}${playing === i ? ' playing' : ''}`}>
            <button className="speaker-btn small" onClick={() => void playOne(i)} aria-label="Прослушать">
              <IconSpeaker size={16} />
            </button>
            <div className="bubble-msg">
              <div className="bubble-en">{l.en}</div>
              {showRu && <div className="bubble-ru">{l.ru}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
