import { useEffect, useState } from 'react';
import type { BuildEx, Tile } from '../../lib/exercises';
import { speak } from '../../lib/tts';
import { Mascot } from '../Mascot';
import { IconSpeaker } from '../Icons';
import type { ExProps } from './common';

export function BuildExercise({ ex, disabled, result, onState, settings }: ExProps<BuildEx>) {
  const [placed, setPlaced] = useState<Tile[]>([]);

  useEffect(() => {
    const expected = ex.answer.map((a) => a.toLowerCase()).join(' ');
    onState({
      ready: placed.length > 0,
      check: () => ({ ok: placed.map((t) => t.text.toLowerCase()).join(' ') === expected, answer: ex.sentence.en }),
    });
  }, [placed, ex, onState]);

  useEffect(() => {
    if (ex.listen && settings.autoplay && !settings.noAudio) speak(ex.sentence.en, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement)) {
        setPlaced((p) => p.slice(0, -1));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled]);

  const zoneCls = 'answer-zone' + (result === null ? '' : result ? ' ok' : ' bad');

  return (
    <div className="exercise">
      <h2 className="ex-title">{ex.listen ? 'Прослушай и собери предложение' : 'Переведи на английский'}</h2>
      {ex.listen ? (
        <div className="listen-box">
          <button className="speaker-btn big" onClick={() => speak(ex.sentence.en, settings)} aria-label="Прослушать">
            <IconSpeaker size={34} />
          </button>
          <button className="link-btn" onClick={() => speak(ex.sentence.en, { ...settings, rate: settings.rate * 0.6 })}>
            Медленнее
          </button>
        </div>
      ) : (
        <div className="prompt-sentence">
          <Mascot size={64} mood="neutral" shadow={false} />
          <div className="speech-bubble">{ex.sentence.ru}</div>
        </div>
      )}
      <div className={zoneCls}>
        {placed.map((t) => (
          <button
            key={t.id}
            className="tile placed"
            disabled={disabled}
            onClick={() => setPlaced((p) => p.filter((x) => x.id !== t.id))}
          >
            {t.text}
          </button>
        ))}
        {placed.length === 0 && <span className="answer-placeholder">Нажимай на слова внизу, чтобы собрать предложение</span>}
      </div>
      <div className="tile-bank">
        {ex.tiles.map((t) => {
          const used = placed.some((p) => p.id === t.id);
          return (
            <button
              key={t.id}
              className={'tile' + (used ? ' used' : '')}
              disabled={disabled || used}
              onClick={() => setPlaced((p) => [...p, t])}
            >
              {t.text}
            </button>
          );
        })}
      </div>
      {result !== null && ex.listen && <div className="ru-hint">{ex.sentence.ru}</div>}
    </div>
  );
}
