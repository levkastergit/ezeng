import { useEffect, useMemo, useRef, useState } from 'react';
import type { GrammarItem, ReadingItem } from '../data/test';
import {
  GRAMMAR_COUNT,
  LEVEL_DESCRIPTIONS,
  READING_COUNT,
  VOCAB_COUNT,
  levelName,
  nextGrammar,
  nextReading,
  nextVocab,
  stepLevel,
  summarize,
} from '../lib/placement';
import type { Answered, PlacementSummary, ReadingOutcome, VocabQuestion } from '../lib/placement';
import { useProgress } from '../lib/progressContext';
import { speak } from '../lib/tts';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { ProgressBar } from '../components/ProgressBar';
import { IconSpeaker } from '../components/Icons';

type Phase = 'intro' | 'vocab' | 'grammar' | 'reading' | 'result';

const TOTAL_STEPS = VOCAB_COUNT + GRAMMAR_COUNT + READING_COUNT;

export function TestScreen() {
  const { progress, update } = useProgress();
  const settings = progress.settings;

  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState(2);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const used = useRef(new Set<string>());
  const vocabAnswers = useRef<Answered[]>([]);
  const grammarAnswers = useRef<Answered[]>([]);
  const readingOutcomes = useRef<ReadingOutcome[]>([]);

  const [vq, setVq] = useState<VocabQuestion | null>(null);
  const [gq, setGq] = useState<GrammarItem | null>(null);
  const [rq, setRq] = useState<ReadingItem | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<(string | null)[]>([]);
  const [summary, setSummary] = useState<PlacementSummary | null>(null);

  const start = () => {
    used.current = new Set();
    vocabAnswers.current = [];
    grammarAnswers.current = [];
    readingOutcomes.current = [];
    setStep(0);
    setLevel(2);
    setSelected(null);
    const q = nextVocab(2, used.current);
    if (q) used.current.add(q.item.en);
    setVq(q);
    setPhase('vocab');
  };

  const answerVocab = (option: string) => {
    if (!vq) return;
    const ok = option === vq.item.ru;
    vocabAnswers.current.push({ lv: vq.item.lv, ok });
    const lv = stepLevel(level, ok, 5);
    setLevel(lv);
    setStep((s) => s + 1);
    if (vocabAnswers.current.length >= VOCAB_COUNT) {
      const gl = Math.min(4, Math.max(1, Math.round(lv * 0.8)));
      setLevel(gl);
      const g = nextGrammar(gl, used.current);
      if (g) used.current.add(g.text);
      setGq(g);
      setPhase('grammar');
      return;
    }
    const q = nextVocab(lv, used.current);
    if (q) used.current.add(q.item.en);
    setVq(q);
  };

  const answerGrammar = (option: string) => {
    if (!gq) return;
    const ok = option === gq.answer;
    grammarAnswers.current.push({ lv: gq.lv, ok });
    const lv = stepLevel(level, ok, 4);
    setLevel(lv);
    setStep((s) => s + 1);
    if (grammarAnswers.current.length >= GRAMMAR_COUNT) {
      const r = nextReading(Math.min(4, lv), used.current);
      if (r) used.current.add(r.id);
      setRq(r);
      setReadingAnswers(r ? r.questions.map(() => null) : []);
      setPhase('reading');
      return;
    }
    const g = nextGrammar(lv, used.current);
    if (g) used.current.add(g.text);
    setGq(g);
  };

  const submitReading = () => {
    if (!rq || readingAnswers.some((a) => a === null)) return;
    const correct = rq.questions.filter((q, i) => readingAnswers[i] === q.answer).length;
    readingOutcomes.current.push({ lv: rq.lv, correct, total: rq.questions.length });
    const ok = correct >= 2;
    const lv = stepLevel(level, ok, 4);
    setLevel(lv);
    setStep((s) => s + 1);
    if (readingOutcomes.current.length >= READING_COUNT) {
      const s = summarize(vocabAnswers.current, grammarAnswers.current, readingOutcomes.current);
      setSummary(s);
      update((p) => ({
        ...p,
        tests: [...p.tests, { at: Date.now(), score: s.score, level: s.level, vocab: s.vocab, grammar: s.grammar, reading: s.reading }].slice(-20),
      }));
      setPhase('result');
      return;
    }
    const r = nextReading(lv, used.current);
    if (r) used.current.add(r.id);
    setRq(r);
    setReadingAnswers(r ? r.questions.map(() => null) : []);
  };

  useEffect(() => {
    if (phase !== 'vocab' && phase !== 'grammar') return;
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const opts = phase === 'vocab' ? vq?.options : gq?.options;
      if (!opts || !(n >= 1 && n <= opts.length)) return;
      if (phase === 'vocab') answerVocab(opts[n - 1]);
      else answerGrammar(opts[n - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vq, gq, level]);

  const history = useMemo(() => [...progress.tests].reverse().slice(0, 5), [progress.tests]);

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Тест уровня</h1>
          <p>
            Адаптивный тест: каждый следующий вопрос подбирается под ваши ответы, поэтому набор заданий каждый раз новый.
            Три части: словарный запас (20 слов), грамматика (12 предложений) и чтение (3 текста). Около 10 минут.
          </p>
        </div>
        <div className="card test-intro">
          <Mascot size={120} mood="wink" />
          <div>
            <h3>Как это работает</h3>
            <ul className="plain-list">
              <li>Слова берутся из пяти уровней сложности, от A1 до C1. Верный ответ поднимает уровень следующего слова, ошибка опускает.</li>
              <li>Грамматика проверяет времена, артикли, условные предложения и порядок слов, от A1 до B2.</li>
              <li>Чтение: короткие тексты с вопросами на понимание, уровень подстраивается после каждого текста.</li>
              <li>Результат — оценка по шкале CEFR (A1–C1) с точностью примерно до одного уровня. Это ориентир для выбора материалов, а не сертификат.</li>
            </ul>
            <Button size="lg" onClick={start}>
              Начать тест
            </Button>
          </div>
        </div>
        {history.length > 0 && (
          <div className="card">
            <h3>Прошлые результаты</h3>
            <div className="test-history">
              {history.map((t) => (
                <div key={t.at} className="test-history-row">
                  <span className="muted">{new Date(t.at).toLocaleDateString('ru-RU')}</span>
                  <b className="level-pill">{t.level}</b>
                  <span className="muted">
                    словарь {levelName(t.vocab)} · грамматика {levelName(t.grammar)} · чтение {levelName(t.reading)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'result' && summary) {
    const rec =
      summary.level === 'A1'
        ? 'Начните с основного курса: модули «Знакомство» и «Семья и дом», затем остальные по порядку.'
        : summary.level === 'A2'
          ? 'Пройдите модули «Каждый день», «Город», «Прошлое и будущее» и «Союзы, предлоги и слова-связки», читайте сказки.'
          : summary.level === 'B1'
            ? 'Основной курс можно пройти быстро для закрепления. Полезнее тематические модули, песни, скороговорки и сказки с озвучкой.'
            : 'Курс для вас в основном на повторение. Используйте сленг, песни и скороговорки для произношения и живой речи.';
    return (
      <div className="page">
        <div className="result-card test-result">
          <Mascot size={150} mood={summary.score >= 2 ? 'excited' : 'happy'} />
          <h1>Ваш уровень: {summary.level}</h1>
          <p className="result-sub">{LEVEL_DESCRIPTIONS[summary.level]}</p>
          <div className="result-stats">
            <div className="result-stat">
              <b>{levelName(summary.vocab)}</b>
              <span>словарный запас</span>
            </div>
            <div className="result-stat">
              <b>{levelName(summary.grammar)}</b>
              <span>грамматика</span>
            </div>
            <div className="result-stat">
              <b>{levelName(summary.reading)}</b>
              <span>чтение</span>
            </div>
          </div>
          <p className="test-rec">{rec}</p>
          <div className="btn-row">
            <Button size="lg" onClick={start}>
              Пройти ещё раз
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setPhase('intro')}>
              Готово
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const partLabel = phase === 'vocab' ? 'Словарь' : phase === 'grammar' ? 'Грамматика' : 'Чтение';

  return (
    <div className="page page-narrow">
      <div className="test-top">
        <span className="muted">
          {partLabel} · шаг {Math.min(step + 1, TOTAL_STEPS)} из {TOTAL_STEPS}
        </span>
        <ProgressBar value={step / TOTAL_STEPS} height={10} />
      </div>

      {phase === 'vocab' && vq && (
        <div className="exercise" key={vq.item.en}>
          <h2 className="ex-title">Что значит это слово?</h2>
          <div className="prompt-row">
            <button className="speaker-btn" onClick={() => speak(vq.item.en, settings)} aria-label="Прослушать">
              <IconSpeaker size={22} />
            </button>
            <div className="prompt-word">{vq.item.en}</div>
          </div>
          <div className="options">
            {vq.options.map((o, i) => (
              <button key={o} className="option" onClick={() => answerVocab(o)}>
                <span className="option-num">{i + 1}</span>
                <span className="option-text">{o}</span>
              </button>
            ))}
          </div>
          <p className="muted test-hint">Не знаете — выбирайте наугад: тест учитывает это и подберёт слова проще.</p>
        </div>
      )}

      {phase === 'grammar' && gq && (
        <div className="exercise" key={gq.text}>
          <h2 className="ex-title">Выберите правильный вариант</h2>
          <div className="gap-sentence test-sentence">{gq.text.replace('___', '______')}</div>
          <div className="options">
            {gq.options.map((o, i) => (
              <button key={o} className="option" onClick={() => answerGrammar(o)}>
                <span className="option-num">{i + 1}</span>
                <span className="option-text">{o}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'reading' && rq && (
        <div className="exercise" key={rq.id}>
          <h2 className="ex-title">{rq.title}</h2>
          <p className="reading-text">{rq.text}</p>
          {rq.questions.map((q, qi) => (
            <div key={q.q} className="reading-q">
              <div className="reading-q-title">
                {qi + 1}. {q.q}
              </div>
              <div className="chips">
                {q.options.map((o) => (
                  <button
                    key={o}
                    className={'chip' + (readingAnswers[qi] === o ? ' selected' : '')}
                    onClick={() => setReadingAnswers((a) => a.map((v, i) => (i === qi ? o : v)))}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="btn-row left" style={{ marginTop: 18 }}>
            <Button onClick={submitReading} disabled={readingAnswers.some((a) => a === null)}>
              {readingOutcomes.current.length + 1 >= READING_COUNT ? 'Завершить тест' : 'Следующий текст'}
            </Button>
          </div>
        </div>
      )}
      {selected && null}
    </div>
  );
}
