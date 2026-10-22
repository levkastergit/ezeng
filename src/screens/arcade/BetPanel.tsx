import { useState } from 'react';
import { BET_MAX_MULT, BET_STAKES, betQuestion, placeBet, settleBet } from '../../lib/arcade';
import type { BetQuestion } from '../../lib/arcade';
import { RARITY, crystalsAvailable, gachaOf } from '../../lib/gacha';
import { useProgress } from '../../lib/progressContext';
import { playSfx } from '../../lib/sfx';
import { speak } from '../../lib/tts';
import { Button } from '../../components/Button';
import { WordImage } from '../../components/WordImage';
import { IconSpeaker } from '../../components/Icons';
import { Balance } from './common';

type Stage = 'idle' | 'question' | 'won' | 'lost';

export function BetPanel() {
  const { progress, update } = useProgress();
  const crystals = crystalsAvailable(progress);
  const g = gachaOf(progress);
  const [stake, setStake] = useState(1);
  const [mult, setMult] = useState(1);
  const [stage, setStage] = useState<Stage>('idle');
  const [q, setQ] = useState<BetQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const ask = () => {
    const next = betQuestion(progress);
    setQ(next);
    setPicked(null);
    setStage('question');
    if (progress.settings.autoplay && !progress.settings.noAudio) speak(next.card.word.en, progress.settings);
  };

  const start = (s: number) => {
    const p = placeBet(progress, s);
    if (!p) return;
    update(() => p);
    setStake(s);
    setMult(1);
    ask();
  };

  const answer = (opt: string) => {
    if (!q || picked) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (progress.settings.sounds) playSfx(ok ? 'ok' : 'bad');
    window.setTimeout(() => {
      if (ok) {
        setMult((m) => m * 2);
        setStage('won');
      } else {
        setStage('lost');
      }
    }, 700);
  };

  const cashOut = () => {
    update((p) => settleBet(p, stake, mult));
    if (progress.settings.sounds) playSfx('level');
    setStage('idle');
  };

  const pot = stake * mult;

  return (
    <div className="arcade-panel">
      <Balance />
      <div className="bet-layout">
        <div className="bet-card">
          {stage === 'idle' && (
            <>
              <h3>Ставка на слово</h3>
              <p className="muted">Поставьте кристаллы и выберите верный перевод. Угадали — ставка удваивается, и можно рискнуть ещё раз: до ×{BET_MAX_MULT}. Ошиблись — ставка сгорает.</p>
              <div className="bet-stakes">
                {BET_STAKES.map((s) => (
                  <Button key={s} size="lg" variant={s === 1 ? 'primary' : 'secondary'} onClick={() => start(s)} disabled={crystals < s}>
                    {s} 💎
                  </Button>
                ))}
              </div>
            </>
          )}

          {stage === 'question' && q && (
            <>
              <div className="bet-pot">
                Ставка {stake} 💎 · множитель ×{mult} → на кону <b>{stake * mult * 2} 💎</b>
              </div>
              <div className="bet-word">
                <WordImage img={q.card.word.img} size={72} fallback={q.card.word.en[0]?.toUpperCase()} />
                <div>
                  <div className="bet-en">
                    {q.card.word.en}
                    <button className="icon-btn" onClick={() => speak(q.card.word.en, progress.settings)} title="Озвучить">
                      <IconSpeaker size={18} />
                    </button>
                  </div>
                  <div className="muted">
                    {q.card.word.cy && <span className="cy-pill">{q.card.word.cy}</span>} {q.card.word.ipa} · <span style={{ color: RARITY[q.card.rarity].color }}>{RARITY[q.card.rarity].short} карта</span>
                  </div>
                </div>
              </div>
              <div className="bet-options">
                {q.options.map((o) => (
                  <button key={o} className={'bet-option' + (picked ? (o === q.answer ? ' correct' : o === picked ? ' wrong' : '') : '')} onClick={() => answer(o)} disabled={!!picked}>
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === 'won' && q && (
            <>
              <h3>Верно! Выигрыш {pot} 💎</h3>
              <p className="muted">
                {q.card.word.en} — {q.card.word.ru}. {mult < BET_MAX_MULT ? `Рискнуть ещё раз и сыграть на ${pot * 2} 💎?` : 'Максимальный множитель!'}
              </p>
              <div className="btn-row">
                <Button size="lg" variant="success" onClick={cashOut}>
                  Забрать {pot} 💎
                </Button>
                {mult < BET_MAX_MULT && (
                  <Button size="lg" onClick={ask}>
                    Рискнуть ×{mult * 2}
                  </Button>
                )}
              </div>
            </>
          )}

          {stage === 'lost' && q && (
            <>
              <h3>Мимо. Ставка сгорела</h3>
              <p className="muted">
                {q.card.word.en} — {q.card.word.ru}. {q.card.word.ex}
              </p>
              <Button size="lg" onClick={() => setStage('idle')}>
                Попробовать снова
              </Button>
            </>
          )}
        </div>
        <div className="wheel-side">
          <h3>Правила</h3>
          <ul className="bet-rules">
            <li>Вопрос: перевод слова, четыре варианта. Чаще всего попадаются слова из вашей коллекции.</li>
            <li>Верный ответ удваивает ставку. Можно забрать или рискнуть: ×2 → ×4 → ×8 → ×16.</li>
            <li>Неверный ответ сжигает всю ставку вместе с накопленным выигрышем.</li>
          </ul>
          <div className="muted small">
            Сыграно: {g.betPlayed} · выиграно всего: {g.betWon} 💎 · лучший множитель: ×{g.betBest || 1}
          </div>
        </div>
      </div>
    </div>
  );
}
