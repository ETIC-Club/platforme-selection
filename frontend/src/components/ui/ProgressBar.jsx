const COLORS = {
  brand: 'bg-brand',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-600',
  rose: 'bg-rose-500',
  white: 'bg-white',
};

export default function ProgressBar({ value = 0, color = 'brand', track = 'bg-neutral-200', height = 'h-2' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`${height} w-full overflow-hidden rounded-full ${track}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`${height} ${COLORS[color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
