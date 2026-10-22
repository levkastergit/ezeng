import { useEffect, useState } from 'react';
import { useProgress } from '../lib/progressContext';
import { clearProgress, defaultProgress } from '../lib/storage';
import { getEnglishVoices, onVoicesChanged, speak, ttsAvailable } from '../lib/tts';
import { Button } from '../components/Button';
import { UpdatePanel } from '../components/UpdatePanel';

const GOALS = [10, 20, 30, 50, 80];

export function SettingsScreen() {
  const { progress, update } = useProgress();
  const s = progress.settings;
  const [voices, setVoices] = useState(() => getEnglishVoices());

  useEffect(() => {
    const off = onVoicesChanged(() => setVoices(getEnglishVoices()));
    const t = setTimeout(() => setVoices(getEnglishVoices()), 500);
    return () => {
      off();
      clearTimeout(t);
    };
  }, []);

  const set = (patch: Partial<typeof s>) => update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

  const reset = () => {
    if (window.confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) {
      clearProgress();
      update(() => ({ ...defaultProgress(), settings: { ...s } }));
    }
  };

  const versions = (window as unknown as { ezeng?: { versions?: { electron: string; chrome: string } } }).ezeng?.versions;

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Настройки</h1>
      </div>

      <div className="card">
        <h3>Профиль</h3>
        <label className="field">
          <span>Имя</span>
          <input value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={24} />
        </label>
        <div className="field">
          <span>Цель на день</span>
          <div className="seg">
            {GOALS.map((g) => (
              <button key={g} className={'seg-btn' + (s.dailyGoal === g ? ' active' : '')} onClick={() => set({ dailyGoal: g })}>
                {g} XP
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Озвучка</h3>
        <p className="muted" style={{ marginBottom: 14 }}>
          Все слова и предложения курса озвучены встроенным английским голосом и работают без интернета.
        </p>
        {ttsAvailable() && voices.length > 0 && (
          <label className="field">
            <span>Системный голос (для текста вне курса)</span>
            <select value={s.voiceURI} onChange={(e) => set({ voiceURI: e.target.value })}>
              <option value="">Автоматически</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Скорость речи: {s.rate.toFixed(1)}</span>
          <input type="range" min={0.5} max={1.3} step={0.1} value={s.rate} onChange={(e) => set({ rate: Number(e.target.value) })} />
        </label>
        <label className="field field-row">
          <input type="checkbox" checked={s.autoplay} onChange={(e) => set({ autoplay: e.target.checked })} />
          <span>Автоматически озвучивать новые слова и задания на слух</span>
        </label>
        <label className="field field-row">
          <input type="checkbox" checked={s.noAudio} onChange={(e) => set({ noAudio: e.target.checked })} />
          <span>Режим без звука: задания на слух заменяются на обычные, ничего не озвучивается автоматически (кнопки озвучки остаются)</span>
        </label>
        <Button variant="secondary" onClick={() => speak('Hello! I am learning English.', s)}>
          Проверить озвучку
        </Button>
      </div>

      <div className="card">
        <h3>Обучение</h3>
        <label className="field field-row">
          <input type="checkbox" checked={s.unlockAll} onChange={(e) => set({ unlockAll: e.target.checked })} />
          <span>Открыть все уроки сразу (без последовательного прохождения)</span>
        </label>
        <label className="field field-row">
          <input type="checkbox" checked={s.turbo} onChange={(e) => set({ turbo: e.target.checked })} />
          <span>Турбо-режим: ответ проверяется сразу после выбора варианта, верный ответ автоматически ведёт к следующему заданию (переключается и кнопкой ⚡ в уроке)</span>
        </label>
      </div>

      <div className="card">
        <h3>Обновления</h3>
        <UpdatePanel />
      </div>

      <div className="card">
        <h3>Данные</h3>
        <p className="muted">Прогресс хранится только на этом компьютере.</p>
        <Button variant="danger" onClick={reset}>
          Сбросить прогресс
        </Button>
      </div>

      <div className="muted about">
        EzEng {__APP_VERSION__}
        {versions ? ` · Electron ${versions.electron} · Chromium ${versions.chrome}` : ''}
        <br />
        Озвучка — Kokoro TTS (Apache 2.0). Иллюстрации — Twemoji (CC BY 4.0). Шрифт Rubik — SIL Open Font License.
      </div>
    </div>
  );
}
