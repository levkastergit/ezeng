interface Props {
  value: number; // 0..1
  color?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({ value, color, height = 14, className = '' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`progress ${className}`.trim()} style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
