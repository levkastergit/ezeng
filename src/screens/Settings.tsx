import { useEffect, useState } from 'react';
import { useProgress } from '../lib/progressContext';
import { clearProgress, defaultProgress, normalizeProgress } from '../lib/storage';
import type { Progress } from '../lib/storage';
import { getEnglishVoices, onVoicesChanged, speak, ttsAvailable } from '../lib/tts';
import { Button } from '../components/Button';
import { UpdatePanel } from '../components/UpdatePanel';
import { AccountCard } from '../components/AccountCard';

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

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezeng-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importProgress = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Progress>;
        if (!parsed || typeof parsed !== 'object' || !('xp' in parsed)) throw new Error('bad');
        if (window.confirm('Заменить текущий прогресс данными из файла?')) {
          update(() => normalizeProgress(parsed));
        }
      } catch {
        window.alert('Это не файл прогресса EzEng.');
      }
    };
    reader.readAsText(file);
  };

  const versions = (window as unknown as { ezeng?: { versions?: { electron: string; chrome: string } } }).ezeng?.versions;

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Настройки</h1>
      </div>

      <AccountCard />

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
          <input type="checkbox" checked={s.sounds} onChange={(e) => set({ sounds: e.target.checked })} />
          <span>Звуки правильного и неправильного ответа</span>
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
        <p className="muted">Файл прогресса можно перенести на другой компьютер или сохранить как резервную копию.</p>
        <div className="btn-row left">
          <Button variant="secondary" onClick={exportProgress}>
            Экспорт в файл
          </Button>
          <label className="btn btn-secondary btn-md file-btn">
            Импорт из файла
            <input type="file" accept="application/json,.json" onChange={(e) => importProgress(e.target.files?.[0])} />
          </label>
          <Button variant="danger" onClick={reset}>
            Сбросить прогресс
          </Button>
        </div>
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
