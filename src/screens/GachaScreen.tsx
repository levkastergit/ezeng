import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { modules } from '../data/course';
import {
  ALL_CARDS,
  CRYSTALS_PER_ACHIEVEMENT,
  CRYSTALS_PER_QUEST_DAY,
  PITY_LIMIT,
  PULL10_COST,
  PULL_COST,
  RARITY,
  RARITY_ORDER,
  SHARDS_PER_CRYSTAL,
  XP_PER_CRYSTAL,
  collectedByRarity,
  crystalsAvailable,
  doPull,
  exchangeShards,
  freePullAvailable,
  gachaOf,
} from '../lib/gacha';
import type { GachaCard, PullResult } from '../lib/gacha';
import { useProgress } from '../lib/progressContext';
import { playSfx } from '../lib/sfx';
import type { Rarity } from '../lib/storage';
import { speak } from '../lib/tts';
import { plural } from '../lib/utils';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { WordImage } from '../components/WordImage';
import { IconClose, IconSpeaker } from '../components/Icons';

type Filter = 'all' | Rarity;
const PAGE = 120;
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.12,
  color: ['#ffd346', '#399bff', '#7b6cf6', '#ff5a3c', '#45c86f', '#ff4fa3'][i % 6],
  size: 6 + (i % 4) * 3,
}));

export function GachaScreen() {
  const { progress, update } = useProgress();
  const g = gachaOf(progress);
  const crystals = crystalsAvailable(progress);
  const free = freePullAvailable(progress);
  const byRarity = collectedByRarity(progress);
  const collected = Object.keys(g.cards).length;
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [moduleId, setModuleId] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const [detail, setDetail] = useState<GachaCard | null>(null);

  // Reveal the drawn cards one by one.
  useEffect(() => {
    if (!results || revealed >= results.length) return;
    const t = window.setTimeout(
      () => {
        const r = results[revealed];
        if (progress.settings.sounds) playSfx(r.card.rarity === 'epic' || r.card.rarity === 'legendary' ? 'level' : 'ok');
        if (r.card.rarity === 'legendary') {
          setConfetti(true);
          window.setTimeout(() => setConfetti(false), 2600);
        }
        if (results.length === 1 && progress.settings.autoplay && !progress.settings.noAudio) speak(r.card.word.en, progress.settings);
        setRevealed((v) => v + 1);
      },
      revealed === 0 ? 350 : 420,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, revealed]);

  const pull = (count: 1 | 10, useFree: boolean) => {
    const r = doPull(progress, count, useFree);
    if (!r) return;
    update(() => r.progress);
    setResults(r.results);
    setRevealed(0);
  };

  const list = useMemo(() => {
    const cards = ALL_CARDS.filter((c) => (filter === 'all' || c.rarity === filter) && (moduleId === 'all' || c.module.id === moduleId));
    const own = g.cards;
    return cards.sort((a, b) => {
      const oa = own[a.key] ? 1 : 0;
      const ob = own[b.key] ? 1 : 0;
      if (oa !== ob) return ob - oa;
      const ra = RARITY[a.rarity].rank;
      const rb = RARITY[b.rarity].rank;
      if (ra !== rb) return rb - ra;
      if (oa && ob) return (own[b.key].at ?? 0) - (own[a.key].at ?? 0);
      return a.word.en.localeCompare(b.word.en);
    });
  }, [filter, moduleId, g.cards]);

  const exchangeable = Math.floor(g.shards / SHARDS_PER_CRYSTAL);
  const pityLeft = Math.max(0, PITY_LIMIT - g.pity);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Гача</h1>
        <p>Крути и собирай слова разной редкости. Каждое выпавшее слово попадает в словарь и повторение.</p>
      </div>

      <div className="gacha-top">
        <div className="gstat crystals" title="Кристаллы: 1 за каждые 5 XP, +3 за достижение, +2 за задания дня">
          <span className="gstat-icon">💎</span>
          <b>{crystals}</b>
          <span>{plural(crystals, 'кристалл', 'кристалла', 'кристаллов')}</span>
        </div>
        <div className="gstat" title="Осколки дают повторные карты; 10 осколков = 1 кристалл">
          <span className="gstat-icon">🧩</span>
          <b>{g.shards}</b>
          <span>{plural(g.shards, 'осколок', 'осколка', 'осколков')}</span>
          {exchangeable > 0 && (
            <button className="link-btn" onClick={() => update((p) => exchangeShards(p))}>
              обменять на {exchangeable} 💎
            </button>
          )}
        </div>
        <div className="gstat">
          <span className="gstat-icon">🃏</span>
          <b>{collected}</b>
          <span>из {ALL_CARDS.length} карт</span>
        </div>
        <div className="gstat pity">
          <span className="gstat-icon">🌟</span>
          <span>
            до гарантированной легендарной: <b>{pityLeft}</b>
          </span>
          <ProgressBar value={g.pity / PITY_LIMIT} color="#f2b21c" height={6} />
        </div>
      </div>

      {results ? (
        <section className="gacha-reveal">
          <div className={'greveal-grid' + (results.length === 1 ? ' single' : '')}>
            {results.map((r, i) => (
              <RevealCard key={i} result={r} open={i < revealed} onClick={() => setRevealed(results.length)} />
            ))}
          </div>
          <div className="greveal-summary">
            {revealed >= results.length ? (
              <>
                <span>
                  Новых карт: <b>{results.filter((r) => r.isNew).length}</b>
                  {results.some((r) => !r.isNew) && (
                    <>
                      {' '}
                      · осколков: <b>+{results.reduce((n, r) => n + r.shards, 0)}</b>
                    </>
                  )}
                </span>
                <div className="btn-row">
                  <Button variant="secondary" onClick={() => setResults(null)}>
                    В коллекцию
                  </Button>
                  <Button onClick={() => pull(10, false)} disabled={crystals < PULL10_COST}>
                    Ещё ×10 · {PULL10_COST} 💎
                  </Button>
                </div>
              </>
            ) : (
              <span className="muted">Нажмите на карту, чтобы открыть все сразу</span>
            )}
          </div>
          {confetti && (
            <div className="confetti" aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, background: c.color, width: c.size, height: c.size * 0.6 }} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="gacha-banner">
          <div className="gbanner-text">
            <h2>Баннер слов</h2>
            <p>Все {ALL_CARDS.length} слов курса. Редкость каждого слова постоянная: собери их все.</p>
            <div className="gacha-rates">
              {RARITY_ORDER.map((r) => (
                <span key={r} className="grate" style={{ '--rc': RARITY[r].color } as CSSProperties}>
                  <i /> {RARITY[r].title} {RARITY[r].chance}%
                </span>
              ))}
            </div>
            <p className="gbanner-note">В крутке ×10 гарантирована хотя бы одна эпическая карта. Легендарная выпадает не позже чем за {PITY_LIMIT} круток.</p>
          </div>
          <div className="gacha-actions">
            {free && (
              <Button size="lg" className="btn-free" onClick={() => pull(1, true)}>
                Бесплатная крутка дня
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={() => pull(1, false)} disabled={crystals < PULL_COST}>
              Крутить ×1 · {PULL_COST} 💎
            </Button>
            <Button size="lg" onClick={() => pull(10, false)} disabled={crystals < PULL10_COST}>
              Крутить ×10 · {PULL10_COST} 💎
            </Button>
            <div className="gacha-howto">
              Кристаллы: 1 за каждые {XP_PER_CRYSTAL} XP, +{CRYSTALS_PER_ACHIEVEMENT} за достижение, +{CRYSTALS_PER_QUEST_DAY} за задания дня. Повторная карта даёт осколки ({RARITY.common.shards}/{RARITY.rare.shards}/{RARITY.epic.shards}/{RARITY.legendary.shards}), {SHARDS_PER_CRYSTAL} осколков = 1 кристалл.
            </div>
          </div>
        </section>
      )}

      <section className="gacha-collection">
        <div className="gcol-head">
          <h2 className="section-title">Коллекция</h2>
          <div className="gcol-counts">
            {RARITY_ORDER.map((r) => (
              <span key={r} className="grate small" style={{ '--rc': RARITY[r].color } as CSSProperties}>
                <i /> {byRarity[r]}/{ALL_CARDS.filter((c) => c.rarity === r).length}
              </span>
            ))}
          </div>
        </div>
        <div className="gcol-filters">
          <div className="seg">
            {(['all', ...RARITY_ORDER] as Filter[]).map((f) => (
              <button
                key={f}
                className={'seg-btn' + (filter === f ? ' active' : '')}
                onClick={() => {
                  setFilter(f);
                  setLimit(PAGE);
                }}
              >
                {f === 'all' ? 'Все' : RARITY[f].title}
              </button>
            ))}
          </div>
          <select
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setLimit(PAGE);
            }}
          >
            <option value="all">Все модули</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="gcol-grid">
          {list.slice(0, limit).map((c) => {
            const own = g.cards[c.key];
            return (
              <button
                key={c.key}
                className={'gmini' + (own ? '' : ' locked')}
                style={{ '--rc': RARITY[c.rarity].color } as CSSProperties}
                onClick={() => own && setDetail(c)}
                title={own ? c.word.en : `${RARITY[c.rarity].title} карта, ещё не выпала`}
              >
                {own ? (
                  <>
                    <WordImage img={c.word.img} size={52} fallback={c.word.en[0]?.toUpperCase()} />
                    <div className="gmini-en">{c.word.en}</div>
                    <div className="gmini-ru">{c.word.ru}</div>
                    {own.n > 1 && <span className="gmini-n">×{own.n}</span>}
                  </>
                ) : (
                  <>
                    <div className="gmini-q">?</div>
                    <div className="gmini-ru">{RARITY[c.rarity].short}</div>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {list.length > limit && (
          <div className="gcol-more">
            <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>
              Показать ещё ({list.length - limit})
            </Button>
          </div>
        )}
      </section>

      {detail && (
        <div className="gmodal" onClick={() => setDetail(null)}>
          <div className="gmodal-card" style={{ '--rc': RARITY[detail.rarity].color } as CSSProperties} onClick={(e) => e.stopPropagation()}>
            <button className="gmodal-close" onClick={() => setDetail(null)} aria-label="Закрыть">
              <IconClose size={18} />
            </button>
            <div className="grarity-tag">{RARITY[detail.rarity].title}</div>
            <WordImage img={detail.word.img} size={110} fallback={detail.word.en[0]?.toUpperCase()} />
            <div className="gmodal-en">
              {detail.word.en}
              <button className="icon-btn" onClick={() => speak(detail.word.en, progress.settings)} title="Озвучить">
                <IconSpeaker size={18} />
              </button>
            </div>
            <div className="wotd-trans">
              {detail.word.cy && <span className="cy-pill">{detail.word.cy}</span>}
              <span className="muted">{detail.word.ipa}</span>
            </div>
            <div className="gmodal-ru">{detail.word.ru}</div>
            <div className="gmodal-ex">
              <span>{detail.word.ex}</span>
              <small className="muted">{detail.word.exRu}</small>
            </div>
            <div className="muted small">
              {detail.module.title} · урок «{detail.lesson.title}» · копий: {g.cards[detail.key]?.n ?? 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RevealCard({ result, open, onClick }: { result: PullResult; open: boolean; onClick: () => void }) {
  const { card } = result;
  return (
    <button className={`gcard ${card.rarity}${open ? ' open' : ''}`} style={{ '--rc': RARITY[card.rarity].color } as CSSProperties} onClick={onClick}>
      <div className="gcard-inner">
        <div className="gcard-front">
          <span>✦</span>
        </div>
        <div className="gcard-back">
          <div className="grarity-tag">{RARITY[card.rarity].title}</div>
          <WordImage img={card.word.img} size={64} fallback={card.word.en[0]?.toUpperCase()} />
          <div className="gcard-en">{card.word.en}</div>
          {card.word.cy && <div className="gcard-cy">{card.word.cy}</div>}
          <div className="gcard-ru">{card.word.ru}</div>
          {result.isNew ? <span className="gcard-new">новая</span> : <span className="gcard-dupe">×{result.copies} · +{result.shards} 🧩</span>}
        </div>
      </div>
    </button>
  );
}
