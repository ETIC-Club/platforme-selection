import { withTransaction } from '../config/db.js';
import * as candidateModel from '../models/candidateModel.js';
import * as assignmentModel from '../models/assignmentModel.js';
import * as evaluationModel from '../models/evaluationModel.js';
import * as eventModel from '../models/eventModel.js';
import * as userModel from '../models/userModel.js';
import * as notificationModel from '../models/notificationModel.js';
import * as logModel from '../models/logModel.js';
import { conflict, notFound, badRequest } from '../utils/AppError.js';
import { fullName } from '../utils/format.js';

export async function assign(event, candidateId, body, admin) {
  const selectorId = Number(body?.selectorId);
  if (!Number.isInteger(selectorId) || selectorId <= 0) throw badRequest('selectorId requis.', { selectorId: 'entier obligatoire' });

  const c = await candidateModel.findInEvent(event.id, candidateId);
  if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');

  const selector = await userModel.findById(selectorId);
  const inEvent = selector && selector.role === 'SELECTOR' && (await eventModel.isActiveSelector(event.id, selectorId));
  if (!inEvent) throw notFound('Sélecteur introuvable ou inactif pour cet événement.', 'SELECTOR_NOT_FOUND');
  if (await assignmentModel.exists(candidateId, selectorId)) throw conflict('Candidature déjà affectée à ce sélecteur.', 'ALREADY_ASSIGNED');

  await withTransaction(async (db) => {
    await assignmentModel.insert({ eventId: event.id, candidateId, selectorId }, db);
    await notificationModel.insert({
      userId: selectorId, eventId: event.id, type: 'ASSIGNMENT',
      title: 'Nouvelle candidature affectée',
      message: `${fullName(c)} (${c.reference}) vous a été affectée.`,
      link: `/events/${event.id}/my-candidates/${candidateId}`,
    }, db);
    await logModel.insert({
      userId: admin.id, eventId: event.id, action: 'ASSIGNMENT_CREATED', entity: 'candidate', entityId: candidateId,
      metadata: { selectorId },
    }, db);
  });
  return { candidateId, selectorId };
}

export async function unassign(event, candidateId, selectorId, admin) {
  const c = await candidateModel.findInEvent(event.id, candidateId);
  if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');
  if (!(await assignmentModel.exists(candidateId, selectorId))) throw notFound('Affectation introuvable.', 'ASSIGNMENT_NOT_FOUND');
  if (await evaluationModel.existsAny(candidateId, selectorId)) {
    throw conflict('Ce sélecteur a déjà une évaluation pour cette candidature : affectation non supprimable.', 'HAS_EVALUATION');
  }
  await withTransaction(async (db) => {
    await assignmentModel.remove(candidateId, selectorId, db);
    await logModel.insert({
      userId: admin.id, eventId: event.id, action: 'ASSIGNMENT_REMOVED', entity: 'candidate', entityId: candidateId,
      metadata: { selectorId },
    }, db);
  });
}

/**
 * Affectation automatique : complète chaque candidature jusqu'au nombre d'évaluations
 * RH / Technique requis, en choisissant à chaque fois le sélecteur actif le moins chargé.
 */
export async function autoAssign(event, admin) {
  const result = await withTransaction(async (db) => {
    const [candidates, loads] = await Promise.all([
      assignmentModel.candidatesWithCounts(event.id, db),
      assignmentModel.selectorLoads(event.id, db),
    ]);
    const pools = {
      RH: loads.filter((s) => s.type === 'RH').map((s) => ({ ...s })),
      TECHNIQUE: loads.filter((s) => s.type === 'TECHNIQUE').map((s) => ({ ...s })),
    };
    const created = [];
    let missing = 0;

    for (const c of candidates) {
      const taken = new Set(c.selectorIds);
      const needs = [
        ['RH', event.requiredRh - c.rhAssigned],
        ['TECHNIQUE', event.requiredTechnical - c.technicalAssigned],
      ];
      for (const [type, count] of needs) {
        for (let i = 0; i < count; i += 1) {
          const pick = pools[type].filter((s) => !taken.has(s.id)).sort((a, b) => a.load - b.load || a.id - b.id)[0];
          if (!pick) { missing += 1; continue; }
          taken.add(pick.id);
          pick.load += 1;
          created.push({ candidateId: c.id, selectorId: pick.id });
        }
      }
    }

    const perSelector = new Map();
    for (const a of created) {
      await assignmentModel.insert({ eventId: event.id, candidateId: a.candidateId, selectorId: a.selectorId }, db);
      perSelector.set(a.selectorId, (perSelector.get(a.selectorId) || 0) + 1);
    }
    for (const [selectorId, n] of perSelector) {
      await notificationModel.insert({
        userId: selectorId, eventId: event.id, type: 'ASSIGNMENT',
        title: 'Nouvelles candidatures affectées',
        message: `${n} nouvelle${n > 1 ? 's' : ''} candidature${n > 1 ? 's' : ''} ${n > 1 ? 'vous ont' : 'vous a'} été affectée${n > 1 ? 's' : ''}.`,
        link: `/events/${event.id}/my-candidates`,
      }, db);
    }
    await logModel.insert({
      userId: admin.id, eventId: event.id, action: 'AUTO_ASSIGN', entity: 'event', entityId: event.id,
      metadata: { created: created.length, missing },
    }, db);
    return { created: created.length, missing, selectorsNotified: perSelector.size };
  });
  return result;
}
