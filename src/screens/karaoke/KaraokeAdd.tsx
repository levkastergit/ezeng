import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../../lib/progressContext';
import { attachTranslation, audioExt, fmtTime, guessFromFileName, hasLrcTimes, karaokeBridge, parseLrc, parsePlain } from '../../lib/karaoke';
import type { LyricsResult, UserKaraokeLine } from '../../lib/karaoke';
import { Button } from '../../components/Button';
import { IconArrowLeft } from '../../components/Icons';

interface Props {
  onDone: (id: string, needsSync: boolean) => void;
  onCancel: () => void;
}

type Chosen = { lines: UserKaraokeLine[]; source: 'lrclib' | 'lrc' | 'manual'; lrclibId?: number; label: string };

export function KaraokeAdd({ onDone, onCancel }: Props) {
  const { update } = useProgress();
  const bridge = karaokeBridge();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [results, setResults] = useState<LyricsResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Read the duration of the chosen file to pick the matching lyrics version.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = 'metadata';
    a.src = url;
    a.onloadedmetadata = () => setDuration(a.duration);
    a.onerror = () => setError('Этот файл не похож на аудио. Подойдут mp3, m4a, ogg, wav, flac, opus.');
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setError('');
    if (!audioExt(f.name)) {
      setError('Поддерживаются файлы mp3, m4a, aac, ogg, opus, wav, flac, webm.');
      return;
    }
    setFile(f);
    const g = guessFromFileName(f.name);
    if (!artist) setArtist(g.artist);
    if (!title) setTitle(g.title);
  };

  const search = async (free?: string) => {
    if (!bridge) return;
    setSearching(true);
    setError('');
    const r = await bridge.searchLyrics(free ? { q: free } : { artist: artist.trim(), title: title.trim() });
    setSearching(false);
    if (!r.ok) {
      setError(r.error === 'timeout' ? 'Сервис текстов не ответил. Проверьте интернет и попробуйте ещё раз.' : `Не удалось найти текст: ${r.error}`);
      setResults([]);
      return;
    }
    setResults(r.results ?? []);
  };

  const sorted = useMemo(() => {
    if (!results) return null;
    return [...results]
      .filter((r) => !r.instrumental && (r.synced || r.plain))
      .sort((a, b) => {
        if (!!b.synced !== !!a.synced) return b.synced ? 1 : -1;
        const da = duration && a.duration ? Math.abs(a.duration - duration) : 999;
        const db = duration && b.duration ? Math.abs(b.duration - duration) : 999;
        return da - db;
      })
      .slice(0, 8);
  }, [results, duration]);

  const choose = (r: LyricsResult) => {
    const lines = r.synced ? parseLrc(r.synced) : parsePlain(r.plain ?? '');
    setChosen({ lines, source: 'lrclib', lrclibId: r.id, label: `${r.artist} — ${r.title}${r.synced ? '' : ' (без тайминга)'}` });
    if (!artist) setArtist(r.artist);
    if (!title) setTitle(r.title);
  };

  const loadLrc = (f: File | undefined) => {
    if (!f) return;
    void f.text().then((text) => {
      const lines = hasLrcTimes(text) ? parseLrc(text) : parsePlain(text);
      if (!lines.some((l) => l.text)) {
        setError('В файле не найден текст.');
        return;
      }
      setChosen({ lines, source: 'lrc', label: f.name });
    });
  };

  const useManual = () => {
    const lines = hasLrcTimes(manualText) ? parseLrc(manualText) : parsePlain(manualText);
    if (!lines.some((l) => l.text)) return;
    setChosen({ lines, source: hasLrcTimes(manualText) ? 'lrc' : 'manual', label: 'текст, вставленный вручную' });
  };

  const save = async () => {
    if (!bridge || !file || !chosen) return;
    setSaving(true);
    setError('');
    const id = `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const ext = audioExt(file.name) ?? 'mp3';
    const r = await bridge.save(id, ext, await file.arrayBuffer());
    setSaving(false);
    if (!r.ok) {
      setError(r.error === 'file too large' ? 'Файл больше 80 МБ.' : `Не удалось сохранить файл: ${r.error}`);
      return;
    }
    const lines = translation.trim() ? attachTranslation(chosen.lines, translation) : chosen.lines;
    update((p) => ({
      ...p,
      karaoke: [
        ...(p.karaoke ?? []),
        {
          id,
          title: title.trim() || file.name,
          artist: artist.trim(),
          duration: duration || undefined,
          lines,
          offset: 0,
          source: chosen.source,
          lrclibId: chosen.lrclibId,
          createdAt: Date.now(),
        },
      ],
    }));
    onDone(id, !lines.some((l) => l.t !== null));
  };

  if (!bridge) {
    return (
      <div className="page page-narrow">
        <p className="muted">Караоке со своими файлами работает только в приложении EzEng.</p>
      </div>
    );
  }

  const timedLines = chosen ? chosen.lines.filter((l) => l.text && l.t !== null).length : 0;
  const textLines = chosen ? chosen.lines.filter((l) => l.text).length : 0;

  return (
    <div className="page page-narrow">
      <button className="back-link" onClick={onCancel}>
        <IconArrowLeft size={18} /> Песни
      </button>
      <div className="page-head">
        <h1>Своя песня в караоке</h1>
        <p>
          Откройте аудиофайл песни со своего компьютера (например, хит с радио), и приложение найдёт к ней синхронизированный текст. Файл остаётся только на этом компьютере;
          тексты ищутся в открытой базе LRCLIB.
        </p>
      </div>

      <div className="card">
        <h3>1. Файл песни</h3>
        <div className="btn-row left">
          <label className="btn btn-primary btn-md file-btn">
            {file ? 'Выбрать другой файл' : 'Выбрать аудиофайл'}
            <input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.webm" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          {file && (
            <span className="muted">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ{duration ? ` · ${fmtTime(duration)}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <h3>2. Текст песни</h3>
        <div className="two-col">
          <label className="field">
            <span>Исполнитель</span>
            <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="The Weeknd" />
          </label>
          <label className="field">
            <span>Название</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blinding Lights" />
          </label>
        </div>
        <div className="btn-row left">
          <Button onClick={() => void search()} disabled={searching || !title.trim()}>
            {searching ? 'Ищем…' : 'Найти текст с таймингом'}
          </Button>
          <label className="btn btn-secondary btn-md file-btn">
            Загрузить .lrc
            <input type="file" accept=".lrc,.txt,text/plain" onChange={(e) => loadLrc(e.target.files?.[0])} />
          </label>
          <Button variant="ghost" onClick={() => setManual((v) => !v)}>
            Вставить текст вручную
          </Button>
        </div>

        {sorted && (
          <div className="lyr-results">
            {sorted.length === 0 && (
              <p className="muted">
                Ничего не нашлось.{' '}
                <button className="link-btn" onClick={() => void search(`${artist} ${title}`.trim())}>
                  Искать по словам
                </button>{' '}
                или вставьте текст вручную.
              </p>
            )}
            {sorted.map((r) => {
              const diff = duration && r.duration ? Math.round(r.duration - duration) : null;
              const isChosen = chosen?.lrclibId === r.id;
              return (
                <div key={r.id} className={'lyr-row' + (isChosen ? ' on' : '')}>
                  <div className="lyr-info">
                    <b>{r.title}</b> — {r.artist}
                    <div className="muted small">
                      {r.album ? `${r.album} · ` : ''}
                      {r.duration ? fmtTime(r.duration) : '?'}
                      {diff !== null && (Math.abs(diff) <= 2 ? ' · совпадает с файлом' : ` · ${diff > 0 ? '+' : ''}${diff} с от файла`)}
                    </div>
                  </div>
                  <span className={'lyr-badge' + (r.synced ? ' synced' : '')}>{r.synced ? 'с таймингом' : 'только текст'}</span>
                  <Button variant={isChosen ? 'success' : 'secondary'} onClick={() => choose(r)}>
                    {isChosen ? 'Выбрано' : 'Выбрать'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {manual && (
          <div className="manual-lyrics">
            <label className="field">
              <span>Текст песни: каждая строка с новой строки. Можно вставить LRC с метками [мм:сс.сс], тогда тайминг сохранится.</span>
              <textarea rows={10} value={manualText} onChange={(e) => setManualText(e.target.value)} />
            </label>
            <Button variant="secondary" onClick={useManual} disabled={!manualText.trim()}>
              Использовать этот текст
            </Button>
          </div>
        )}

        {chosen && (
          <p className="chosen-note">
            Выбран текст: <b>{chosen.label}</b> · строк: {textLines}
            {timedLines ? `, с таймингом: ${timedLines}` : '. Тайминга нет: после сохранения вы расставите строки нажатием клавиши, пока играет песня.'}
          </p>
        )}
      </div>

      <div className="card">
        <h3>3. Перевод (необязательно)</h3>
        <label className="field">
          <span>Перевод построчно: строки идут в том же порядке, что и строки песни (пустые строки пропускаются).</span>
          <textarea rows={6} value={translation} onChange={(e) => setTranslation(e.target.value)} />
        </label>
        <p className="muted small">Перевод отдельных слов доступен и без этого: во время караоке нажмите на слово, и приложение покажет его из словаря курса.</p>
      </div>

      {error && <div className="login-error">{error}</div>}
      <div className="btn-row left">
        <Button size="lg" onClick={() => void save()} disabled={!file || !chosen || saving}>
          {saving ? 'Сохраняем…' : 'Сохранить и открыть'}
        </Button>
        <Button size="lg" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
