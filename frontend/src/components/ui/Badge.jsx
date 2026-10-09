import { EVAL_STATUS_LABELS, STATUS_LABELS, TYPE_LABELS } from '../../utils/format.js';

const TONES = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-700',
  brand: 'bg-brand-light text-brand-dark',
  gray: 'bg-neutral-200 text-neutral-600',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}

const DECISION_TONE = { ACCEPTED: 'green', REJECTED: 'red', PENDING: 'amber' };

/** Statut final (candidature) ou décision (évaluation) : ACCEPTED | REJECTED | PENDING */
export function StatusBadge({ status }) {
  if (!status) return <Badge tone="gray">—</Badge>;
  return <Badge tone={DECISION_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

const EVAL_TONE = { NOT_STARTED: 'gray', IN_PROGRESS: 'amber', COMPLETED: 'green' };
export const EvalStatusBadge = ({ status }) => <Badge tone={EVAL_TONE[status]}>{EVAL_STATUS_LABELS[status]}</Badge>;

export const TypeBadge = ({ type }) => <Badge tone={type === 'RH' ? 'indigo' : 'brand'}>{TYPE_LABELS[type] || type}</Badge>;
