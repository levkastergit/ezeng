import { useMemo } from 'react';
import { allLessons } from '../data/course';
import { alphabet, legend, sounds } from '../data/sounds';
import type { Word } from '../data/types';
import { useProgress } from '../lib/progressContext';
import { speak } from '../lib/tts';
import { IconSpeaker } from '../components/Icons';

export function SoundsScreen() {
  const { progress } = useProgress();
  const settings = progress.settings;

  const wordsByEn = useMemo(() => {
    const m = new Map<string, Word>();
    allLessons.forEach((l) => l.words.forEach((w) => {
      if (!m.has(w.en)) m.set(w.en, w);
    }));
    return m;
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Звуки и алфавит</h1>
        <p>Нажимай на буквы и слова, чтобы услышать их. Русскими буквами записано примерное чтение: оно помогает начать, а точный звук даёт озвучка.</p>
      </div>

      <div className="card">
        <h3>Алфавит</h3>
        <div className="alphabet">
          {alphabet.map((l) => (
            <button key={l.en} className="letter" onClick={() => speak(l.en, settings)} title={l.ipa}>
              <span className="letter-big">
                {l.en}
                <small>{l.en.toLowerCase()}</small>
              </span>
              <span className="letter-name">{l.cy}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Звуки, которые надо запомнить</h3>
        <p className="muted" style={{ marginBottom: 16 }}>
          В английском есть звуки, которых нет в русском. Ниже — самые важные, с подсказкой, как поставить язык и губы.
        </p>
        <div className="sound-list">
          {sounds.map((s) => (
            <div key={s.ipa + s.title} className="sound-row">
              <div className="sound-badges">
                <span className="sound-ipa">{s.ipa}</span>
                <span className="sound-cy">{s.cy}</span>
              </div>
              <div className="sound-body">
                <div className="sound-title">{s.title}</div>
                <p className="muted">{s.tip}</p>
                <div className="sound-examples">
                  {s.examples.map((e) => {
                    const w = wordsByEn.get(e.en);
                    const cy = e.cy ?? w?.cy ?? '';
                    return (
                      <button key={e.en} className="example-chip" onClick={() => speak(e.en, settings)}>
                        <IconSpeaker size={14} className="c-blue" />
                        <b>{e.en}</b>
                        {cy && <span className="muted">{cy}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Как читать наши подсказки</h3>
        <ul className="legend">
          {legend.map((l) => (
            <li key={l.sign}>
              <b>{l.sign}</b>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
