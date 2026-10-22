import { useMemo, useState } from 'react';
import { allLessons, totalWords, wordKey } from '../data/course';
import type { Lesson, Word } from '../data/types';
import { useProgress } from '../lib/progressContext';
import type { WordState } from '../lib/storage';
import { formatDue } from '../lib/utils';
import { speak } from '../lib/tts';
import { IconSearch, IconSpeaker } from '../components/Icons';
import { WordImage } from '../components/WordImage';

interface Row {
  word: Word;
  lesson: Lesson;
  state?: WordState;
}

export function Dictionary() {
  const { progress } = useProgress();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'learned' | 'all'>('learned');
  const now = Date.now();
  const learnedCount = Object.keys(progress.words).length;

  const rows = useMemo(() => {
    const list: Row[] = [];
    allLessons.forEach((lesson) =>
      lesson.words.forEach((word) => {
        const state = progress.words[wordKey(lesson.id, word.en)];
        if (tab === 'all' || state) list.push({ word, lesson, state });
      }),
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((r) => r.word.en.toLowerCase().includes(needle) || r.word.ru.toLowerCase().includes(needle));
  }, [progress.words, q, tab]);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Словарь</h1>
        <p>
          Выучено {learnedCount} из {totalWords} слов курса.
        </p>
      </div>
      <div className="dict-toolbar">
        <div className="tabs">
          <button className={'tab' + (tab === 'learned' ? ' active' : '')} onClick={() => setTab('learned')}>
            Мои слова ({learnedCount})
          </button>
          <button className={'tab' + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>
            Все слова ({totalWords})
          </button>
        </div>
        <label className="search">
          <IconSearch size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по словам…" />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          {tab === 'learned' && learnedCount === 0 ? 'Здесь появятся слова из пройденных уроков.' : 'Ничего не найдено.'}
        </div>
      ) : (
        <div className="dict-list">
          {rows.map((r) => (
            <div key={`${r.lesson.id}/${r.word.en}`} className={'dict-row' + (r.state ? '' : ' not-learned')}>
              <button className="speaker-btn small" onClick={() => speak(r.word.en, progress.settings)} aria-label="Прослушать">
                <IconSpeaker size={18} />
              </button>
              <WordImage img={r.word.img} size={40} className="dict-img" fallback={r.word.en.slice(0, 1).toUpperCase()} />
              <div className="dict-en">
                <b>{r.word.en}</b>
                <span className="dict-ipa">
                  {r.word.ipa}
                  {r.word.cy ? ` · ${r.word.cy}` : ''}
                </span>
              </div>
              <div className="dict-ru">{r.word.ru}</div>
              <div className="dict-meta">
                <span className="tag">
                  {r.lesson.emoji} {r.lesson.title}
                </span>
                {r.state ? (
                  <span className={'tag' + (r.state.due <= now ? ' tag-warn' : ' tag-ok')}>
                    {r.state.due <= now ? 'пора повторить' : formatDue(r.state.due, now)}
                  </span>
                ) : (
                  <span className="tag tag-muted">не изучено</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
