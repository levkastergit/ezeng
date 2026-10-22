import { useEffect, useState } from 'react';
import { twisters } from '../data/twisters';
import { useProgress } from '../lib/progressContext';
import { speak, stopSpeaking } from '../lib/tts';
import { IconSpeaker } from '../components/Icons';

export function TwistersScreen() {
  const { progress } = useProgress();
  const settings = progress.settings;
  const [showCy, setShowCy] = useState(true);
  const [showRu, setShowRu] = useState(true);

  useEffect(() => () => stopSpeaking(), []);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Скороговорки</h1>
        <p>
          Классические английские скороговорки для тренировки произношения. Слушай в обычном и медленном темпе, повторяй вслух, начиная медленно и ускоряясь.
        </p>
      </div>

      <div className="toggles">
        <button className={'toggle' + (showCy ? ' on' : '')} onClick={() => setShowCy((v) => !v)}>
          Транскрипция
        </button>
        <button className={'toggle' + (showRu ? ' on' : '')} onClick={() => setShowRu((v) => !v)}>
          Перевод
        </button>
      </div>

      <div className="twister-list">
        {twisters.map((t, i) => (
          <div key={t.id} className="card twister-card">
            <div className="twister-head">
              <span className="twister-num">{i + 1}</span>
              <span className="pill pill-purple twister-focus">звук {t.focus}</span>
            </div>
            <div className="twister-en">{t.en}</div>
            {showCy && t.cy && <div className="twister-cy">{t.cy}</div>}
            {showRu && <div className="twister-ru">{t.ru}</div>}
            <div className="twister-tip">{t.tip}</div>
            <div className="btn-row left">
              <button className="chip-btn" onClick={() => speak(t.en, settings)}>
                <IconSpeaker size={16} /> Слушать
              </button>
              <button className="chip-btn" onClick={() => speak(t.en, { ...settings, rate: settings.rate * 0.6 })}>
                🐢 Медленно
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
