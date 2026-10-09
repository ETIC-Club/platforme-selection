import { formatDate, formatDateShort, plural } from '../../utils/format.js';
import { EmptyState } from './Feedback.jsx';

const DOT = { SOON: 'bg-red-600', ONGOING: 'bg-amber-500', UPCOMING: 'bg-green-500', DONE: 'bg-neutral-400' };
const PILL = {
  SOON: 'bg-red-100 text-red-600',
  ONGOING: 'bg-amber-100 text-amber-700',
  UPCOMING: 'bg-green-100 text-green-700',
  DONE: 'bg-neutral-200 text-neutral-600',
};

function label(step) {
  if (step.state === 'SOON') return step.daysLeft === 0 ? "Aujourd'hui" : `Dans ${step.daysLeft} ${plural(step.daysLeft, 'jour', 'jours')}`;
  return { ONGOING: 'En cours', UPCOMING: 'À venir', DONE: 'Terminée' }[step.state];
}

export default function NextSteps({ steps = [] }) {
  if (!steps.length) return <EmptyState title="Aucune étape planifiée" />;
  return (
    <ol className="space-y-5">
      {steps.map((s) => (
        <li key={s.id} className="flex gap-3">
          <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${DOT[s.state]}`} />
          <div>
            <p className="font-semibold">{s.title}</p>
            <p className="text-xs text-neutral-500">
              {s.endsOn ? `${formatDateShort(s.startsOn)} – ${formatDate(s.endsOn)}` : formatDate(s.startsOn)}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[s.state]}`}>{label(s)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
