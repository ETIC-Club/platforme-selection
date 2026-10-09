import * as candidateModel from '../models/candidateModel.js';
import * as assignmentModel from '../models/assignmentModel.js';
import * as logModel from '../models/logModel.js';
import { withTransaction } from '../config/db.js';
import { badRequest, conflict, notFound } from '../utils/AppError.js';
import { oneOf, optionalText, parsePagination, buildPagination } from '../utils/validators.js';
import { candidateSummary, fullName } from '../utils/format.js';

const STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'];

export async function listCandidates(event, query) {
  const page = parsePagination(query);
  const filters = {
    ...page,
    search: optionalText(query.search, 'search', 100),
    track: optionalText(query.track, 'track', 100),
    status: oneOf(query.status, STATUSES, 'status'),
    evaluation: oneOf(query.evaluation, ['COMPLETE', 'INCOMPLETE'], 'evaluation'),
    assigned: oneOf(query.assigned, ['true', 'false'], 'assigned'),
    sort: oneOf(query.sort, candidateModel.SORT_KEYS, 'sort'),
    order: oneOf(query.order, ['asc', 'desc'], 'order'),
  };
  const [{ rows, total }, tracks] = await Promise.all([
    candidateModel.adminList(event.id, filters),
    candidateModel.distinctTracks(event.id),
  ]);
  return {
    items: rows.map(candidateSummary),
    pagination: buildPagination(page, total),
    filters: { tracks },
  };
}

export async function getCandidate(event, candidateId) {
  const c = await candidateModel.findInEvent(event.id, candidateId);
  if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');
  const assignments = await assignmentModel.listForCandidate(candidateId);
  const completed = c.rhDone + c.technicalDone;
  const required = c.rhRequired + c.technicalRequired;

  return {
    candidate: {
      id: c.id,
      reference: c.reference,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: fullName(c),
      email: c.email,
      phone: c.phone,
      track: c.track,
      school: c.school,
      studyLevel: c.studyLevel,
      motivation: c.motivation,
      experience: c.experience,
      skills: c.skills,
      githubUrl: c.githubUrl,
      portfolioUrl: c.portfolioUrl,
      technicalAnswer: c.technicalAnswer,
      submittedAt: c.submittedAt,
      status: c.status,
      decidedAt: c.decidedAt,
      decidedByName: c.decidedByName,
    },
    progress: {
      rh: { completed: c.rhDone, required: c.rhRequired },
      technical: { completed: c.technicalDone, required: c.technicalRequired },
      completed,
      required,
      fullyEvaluated: c.fullyEvaluated,
    },
    assignments: assignments.map((a) => ({
      selectorId: a.selectorId,
      name: a.name,
      email: a.email,
      type: a.type,
      assignedAt: a.assignedAt,
      evaluation: a.decision ? { decision: a.decision, comment: a.comment, evaluatedAt: a.evaluatedAt } : null,
    })),
  };
}

/** Le statut final est décidé MANUELLEMENT par l'Admin (jamais calculé automatiquement). */
export async function setFinalStatus(event, candidateId, body, admin) {
  const status = oneOf(body?.status, STATUSES, 'status', { optional: false });
  const c = await candidateModel.findInEvent(event.id, candidateId);
  if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');
  if (c.status === status) throw badRequest(`La candidature est déjà au statut ${status}.`);

  if (status === 'ACCEPTED') {
    const accepted = await candidateModel.countAccepted(event.id);
    if (accepted >= event.quota) {
      throw conflict(`Quota atteint : ${event.quota} places seulement.`, 'QUOTA_REACHED');
    }
  }

  await withTransaction(async (db) => {
    await candidateModel.setStatus(candidateId, status, admin.id, db);
    await logModel.insert({
      userId: admin.id, eventId: event.id, action: 'CANDIDATE_STATUS_SET', entity: 'candidate', entityId: candidateId,
      metadata: { from: c.status, to: status },
    }, db);
  });
  return { id: candidateId, status, decidedAt: new Date().toISOString(), decidedByName: admin.name };
}
