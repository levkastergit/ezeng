import { useEffect } from 'react';

export interface ToastItem {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

interface Props {
  items: ToastItem[];
  onClose: (id: string) => void;
}

const TTL_MS = 4500;

function ToastRow({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(item.id), TTL_MS);
    return () => clearTimeout(t);
  }, [item.id, onClose]);
  return (
    <button className="toast" onClick={() => onClose(item.id)}>
      <span className="toast-emoji">{item.emoji}</span>
      <span className="toast-text">
        <b>{item.title}</b>
        <span>{item.desc}</span>
      </span>
    </button>
  );
}

export function ToastStack({ items, onClose }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {items.slice(0, 3).map((it) => (
        <ToastRow key={it.id} item={it} onClose={onClose} />
      ))}
    </div>
  );
}
