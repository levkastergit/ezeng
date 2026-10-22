import { useEffect, useRef, useState } from 'react';
import { tales } from '../data/tales';
import type { Tale } from '../data/tales';
import { taleImages } from '../data/taleImages';
import { useProgress } from '../lib/progressContext';
import { speakAsync, stopSpeaking } from '../lib/tts';
import { Button } from '../components/Button';
import { IconArrowLeft, IconPlay, IconSpeaker, IconStop } from '../components/Icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function imgUrl(file: string) {
  return `${import.meta.env.BASE_URL}tales/${file}`;
}

function imageFor(tale: Tale, page: number): { img?: string; credit?: string } {
  const own = tale.pages[page];
  if (own?.img) return { img: own.img, credit: own.credit };
  const ti = taleImages[tale.id]?.[page];
  return ti ? { img: ti.file, credit: ti.credit } : {};
}

function coverOf(tale: Tale): { img?: string; credit?: string } {
  for (let i = 0; i < tale.pages.length; i++) {
    const im = imageFor(tale, i);
    if (im.img) return im;
  }
  return {};
}

export function TalesScreen() {
  const { progress, update } = useProgress();
  const settings = progress.settings;
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showRu, setShowRu] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);
  const cancelRef = useRef(false);

  useEffect(
    () => () => {
      cancelRef.current = true;
      stopSpeaking();
    },
    [],
  );

  const tale = tales.find((t) => t.id === openId) ?? null;

  const stop = () => {
    cancelRef.current = true;
    stopSpeaking();
    setPlaying(null);
  };

  const open = (id: string | null) => {
    stop();
    setOpenId(id);
    setPage(0);
  };

  const goto = (p: number) => {
    stop();
    setPage(p);
    if (tale && p === tale.pages.length - 1 && !progress.talesDone.includes(tale.id)) {
      update((pr) => ({ ...pr, talesDone: [...pr.talesDone, tale.id] }));
    }
  };

  const playParagraph = async (i: number) => {
    if (!tale) return;
    stop();
    cancelRef.current = false;
    setPlaying(i);
    await speakAsync(tale.pages[page].paragraphs[i].en, settings);
    setPlaying((p) => (p === i ? null : p));
  };

  const playPage = async () => {
    if (!tale) return;
    stop();
    cancelRef.current = false;
    const paras = tale.pages[page].paragraphs;
    for (let i = 0; i < paras.length; i++) {
      if (cancelRef.current) return;
      setPlaying(i);
      await speakAsync(paras[i].en, settings);
      if (cancelRef.current) return;
      await sleep(400);
    }
    setPlaying(null);
  };

  if (tale) {
    const pg = tale.pages[page];
    const image = imageFor(tale, page);
    const last = page === tale.pages.length - 1;
    return (
      <div className="page">
        <button className="back-link" onClick={() => open(null)}>
          <IconArrowLeft size={18} /> Все сказки
        </button>
        <div className="song-head">
          <div>
            <h1>{tale.title}</h1>
            <p className="muted">
              {tale.titleRu} · {tale.source} · уровень {tale.level}
            </p>
          </div>
        </div>

        <div className="tale-page card">
          {image.img && (
            <figure className="tale-figure">
              <img src={imgUrl(image.img)} alt="" />
              {image.credit && <figcaption>{image.credit}</figcaption>}
            </figure>
          )}
          <div className="tale-text">
            {pg.paragraphs.map((p, i) => (
              <div key={i} className={'song-line' + (playing === i ? ' playing' : '')}>
                <button className="speaker-btn small" onClick={() => void playParagraph(i)} aria-label="Прослушать">
                  <IconSpeaker size={16} />
                </button>
                <div className="song-line-text">
                  <div className="tale-en">{p.en}</div>
                  {showRu && <div className="song-ru">{p.ru}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tale-nav">
          <Button variant="secondary" disabled={page === 0} onClick={() => goto(page - 1)}>
            ← Назад
          </Button>
          <div className="tale-nav-center">
            <span className="muted">
              Страница {page + 1} из {tale.pages.length}
            </span>
            {playing === null ? (
              <button className="chip-btn" onClick={() => void playPage()}>
                <IconPlay size={14} /> Слушать страницу
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
          {last ? (
            <Button onClick={() => open(null)}>Конец ✓</Button>
          ) : (
            <Button onClick={() => goto(page + 1)}>Дальше →</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Сказки</h1>
        <p>
          Классические сказки, пересказанные простым английским, с переводом, озвучкой каждого абзаца и иллюстрациями из старинных книг.
          Читайте по страницам: сначала слушайте, потом читайте вслух сами.
        </p>
      </div>
      <div className="tale-grid">
        {tales.map((t) => {
          const cover = coverOf(t);
          const done = progress.talesDone.includes(t.id);
          return (
            <button key={t.id} className={'tale-card' + (done ? ' done' : '')} onClick={() => open(t.id)}>
              <div className="tale-cover">
                {cover.img ? <img src={imgUrl(cover.img)} alt="" /> : <span className="tale-cover-emoji">📖</span>}
              </div>
              <div className="tale-card-text">
                <div className="tale-card-title">{t.title}</div>
                <div className="muted">
                  {t.titleRu} · {t.level} · {t.pages.length} стр.
                </div>
                {done && <span className="tag tag-ok">прочитано</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
