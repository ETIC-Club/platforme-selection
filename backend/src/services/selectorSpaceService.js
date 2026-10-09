import * as space from '../models/selectorSpaceModel.js';
import * as statsModel from '../models/statsModel.js';
import { formatEvent, getNextSteps } from './eventService.js';
import { notFound } from '../utils/AppError.js';
import { oneOf, optionalText, parsePagination, buildPagination, percent } from '../utils/validators.js';
import { evaluationStatus, fullName } from '../utils/format.js';

// Informations de candidature autorisées selon le type de sélecteur.
// Aucun sélecteur ne voit l'email, le téléphone ni le statut final.
const VISIBLE_FIELDS = {
  RH: ['school', 'studyLevel', 'motivation', 'experience'],
  TECHNIQUE: ['school', 'studyLevel', 'skills', 'githubUrl', 'portfolioUrl', 'technicalAnswer'],
};

const isDone = (o) => o.decision === 'ACCEPTED' || o.decision === 'REJECTED';

/** Navigation précédent / suivant parmi les candidatures du sélecteur. */
export function buildNavigation(ordered, candidateId) {
  const idx = ordered.findIndex((o) => o.candidateId === candidateId);
  const afterTodo = ordered.slice(idx + 1).find((o) => !isDone(o));
  const beforeTodo = ordered.slice(0, Math.max(idx, 0)).find((o) => !isDone(o));
  return {
    position: idx + 1,
    total: ordered.length,
    previousId: idx > 0 ? ordered[idx - 1].candidateId : null,
    nextId: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1].candidateId : null,
    nextToEvaluateId: (afterTodo || beforeTodo)?.candidateId ?? null,
  };
}

export async function getSelectorStats(eventId, selectorId) {
  const [s] = await statsModel.selectorsProgress(eventId, selectorId);
  return {
    assigned: s.assigned,
    evaluated: s.evaluated, // ACCEPTED + REJECTED uniquement (PENDING = encore à traiter)
    remaining: s.assigned - s.evaluated,
    progress: percent(s.evaluated, s.assigned),
    decisions: { accepted: s.accepted, rejected: s.rejected, pending: s.pending },
  };
}

export async function getMyDashboard(event, user) {
  const [stats, latest, ordered, nextSteps] = await Promise.all([
    getSelectorStats(event.id, user.id),
    space.latestEvaluated(event.id, user.id, 5),
    space.orderedAssigned(event.id, user.id),
    getNextSteps(event.id),
  ]);
  return {
    event: formatEvent(event),
    ...stats,
    nextCandidateId: ordered.find((o) => !isDone(o))?.candidateId ?? null,
    latestEvaluated: latest.map((c) => ({
      candidateId: c.candidateId,
      reference: c.reference,
      fullName: fullName(c),
      track: c.track,
      decision: c.decision,
      evaluatedAt: c.evaluatedAt,
    })),
    nextSteps,
  };
}

export async function listMyCandidates(event, user, query) {
  const page = parsePagination(query);
  const filters = {
    ...page,
    search: optionalText(query.search, 'search', 100),
    track: optionalText(query.track, 'track', 100),
    decision: oneOf(query.decision, ['ACCEPTED', 'REJECTED', 'PENDING', 'NOT_STARTED', 'TODO'], 'decision'),
    sort: oneOf(query.sort, space.SORT_KEYS, 'sort'),
    order: oneOf(query.order, ['asc', 'desc'], 'order'),
  };
  const [{ rows, total }, tracks] = await Promise.all([
    space.listAssigned(event.id, user.id, filters),
    space.distinctTracks(event.id, user.id),
  ]);
  return {
    items: rows.map((c) => ({
      candidateId: c.candidateId,
      reference: c.reference,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: fullName(c),
      track: c.track,
      decision: c.decision,
      evaluationStatus: evaluationStatus(c.decision), // NOT_STARTED | IN_PROGRESS | COMPLETED
      evaluatedAt: c.evaluatedAt,
      submittedAt: c.submittedAt,
      assignedAt: c.assignedAt,
    })),
    pagination: buildPagination(page, total),
    filters: { tracks },
  };
}

export async function getMyCandidate(event, user, candidateId) {
  // Si la candidature n'est pas affectée à ce sélecteur → 404 (on ne révèle pas son existence).
  const c = await space.findAssigned(event.id, user.id, candidateId);
  if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');

  const visibleFields = VISIBLE_FIELDS[user.selectorType];
  const candidate = {
    id: c.id,
    reference: c.reference,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: fullName(c),
    track: c.track,
    submittedAt: c.submittedAt,
  };
  for (const f of visibleFields) candidate[f] = c[f];

  const ordered = await space.orderedAssigned(event.id, user.id);
  return {
    candidate,
    visibleFields,
    myEvaluation: c.decision ? { decision: c.decision, comment: c.comment, evaluatedAt: c.evaluatedAt } : null,
    navigation: buildNavigation(ordered, candidateId),
  };
}
