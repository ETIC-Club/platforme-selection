import * as statsModel from '../models/statsModel.js';
import * as candidateModel from '../models/candidateModel.js';
import { formatEvent, getNextSteps } from './eventService.js';
import { candidateSummary } from '../utils/format.js';
import { percent } from '../utils/validators.js';

export const mapSelectorProgress = (s) => ({
  id: s.id,
  name: s.name,
  email: s.email,
  avatarUrl: s.avatarUrl,
  type: s.type, // RH | TECHNIQUE
  isActive: s.isActive,
  assigned: s.assigned,
  evaluated: s.evaluated,
  remaining: s.assigned - s.evaluated,
  progress: percent(s.evaluated, s.assigned),
  decisions: { accepted: s.accepted, rejected: s.rejected, pending: s.pending },
});

/** Dashboard Admin : TOUS les chiffres sont calculés ici, depuis la base. */
export async function getAdminDashboard(event) {
  const [totals, evals, tracks, selectorRows, recent, pending, nextSteps] = await Promise.all([
    statsModel.candidateTotals(event.id),
    statsModel.evaluationTotals(event.id),
    statsModel.trackProgress(event.id),
    statsModel.selectorsProgress(event.id),
    candidateModel.listShort(event.id, { order: 'DESC', limit: 5 }),
    candidateModel.listShort(event.id, { status: 'PENDING', order: 'ASC', limit: 5 }),
    getNextSteps(event.id),
  ]);

  const required = evals.rhRequired + evals.technicalRequired;
  const completed = evals.rhDone + evals.technicalDone;

  const selectors = selectorRows.map(mapSelectorProgress);
  const active = selectors.filter((s) => s.isActive);
  const rhCount = active.filter((s) => s.type === 'RH').length;
  const technicalCount = active.length - rhCount;
  const rhPercent = percent(rhCount, active.length);

  return {
    event: formatEvent(event),
    candidates: {
      total: totals.total,
      assigned: totals.assigned,
      fullyEvaluated: evals.fullyEvaluated,
      remaining: totals.total - evals.fullyEvaluated,
    },
    results: { accepted: totals.accepted, rejected: totals.rejected, pending: totals.pending },
    evaluations: {
      rh: { completed: evals.rhDone, required: evals.rhRequired },
      technical: { completed: evals.technicalDone, required: evals.technicalRequired },
      completed,
      required,
      remaining: required - completed,
      progress: percent(completed, required),
    },
    quota: {
      total: event.quota,
      accepted: totals.accepted,
      remaining: Math.max(0, event.quota - totals.accepted),
    },
    tracks: tracks.map((t) => ({
      name: t.name,
      candidates: t.candidates,
      completed: t.completed,
      required: t.required,
      remaining: t.required - t.completed,
      progress: percent(t.completed, t.required),
    })),
    selectorsBreakdown: {
      rh: { count: rhCount, percent: rhPercent },
      technical: { count: technicalCount, percent: active.length ? 100 - rhPercent : 0 },
    },
    selectors,
    recentCandidates: recent.map(candidateSummary),
    pendingCandidates: pending.map(candidateSummary),
    nextSteps,
  };
}
