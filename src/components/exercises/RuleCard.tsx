import type { Rule } from '../../data/types';
import type { Settings } from '../../lib/storage';
import { speak } from '../../lib/tts';
import { Mascot } from '../Mascot';
import { IconSpeaker } from '../Icons';

export function RuleCard({ rule, settings }: { rule: Rule; settings: Settings }) {
  return (
    <div className="exercise rule-card">
      <div className="pill pill-purple">Правило</div>
      <h2 className="rule-title">{rule.title}</h2>
      <div className="rule-body">
        {rule.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="rule-examples">
        {rule.examples.map((e) => (
          <button key={e.en} className="rule-example" onClick={() => speak(e.en, settings)}>
            <IconSpeaker size={18} className="c-blue" />
            <span className="ex-en">{e.en}</span>
            <span className="ex-ru">{e.ru}</span>
          </button>
        ))}
      </div>
      {rule.tip && (
        <div className="rule-tip">
          <Mascot size={56} mood="wink" shadow={false} />
          <div>
            <div className="rule-tip-label">Подсказка</div>
            <div>{rule.tip}</div>
          </div>
        </div>
      )}
    </div>
  );
}
