import Icon from './Icon.jsx';

const TONES = {
  white: { box: 'bg-surface shadow-card', icon: 'bg-brand text-white', label: 'text-neutral-500', foot: 'text-neutral-500' },
  green: { box: 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-card', icon: 'bg-white/20', label: 'text-white', foot: 'text-white/80' },
  amber: { box: 'bg-gradient-to-br from-amber-600 to-amber-400 text-white shadow-card', icon: 'bg-white/20', label: 'text-white', foot: 'text-white/80' },
  red: { box: 'bg-gradient-to-br from-red-700 to-rose-500 text-white shadow-card', icon: 'bg-white/20', label: 'text-white', foot: 'text-white/80' },
  teal: { box: 'bg-gradient-to-br from-teal-600 to-brand text-white shadow-card', icon: 'bg-white/20', label: 'text-white', foot: 'text-white/80' },
};

export default function StatCard({ tone = 'white', icon, label, value, suffix, footer, children }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-2xl p-5 ${t.box}`}>
      <div className="flex items-center gap-3">
        {icon && <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${t.icon}`}><Icon name={icon} className="h-5 w-5" /></span>}
        <span className={`text-sm font-medium ${t.label}`}>{label}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <span className="text-4xl font-bold leading-none">{value}</span>
        {suffix && <span className={`text-xs ${t.foot}`}>{suffix}</span>}
      </div>
      {children}
      {footer && <p className={`mt-3 text-xs ${t.foot}`}>{footer}</p>}
    </div>
  );
}

/** Petite tuile blanche pour les chiffres secondaires. */
export function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
