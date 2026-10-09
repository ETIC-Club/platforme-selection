import { withTransaction } from '../config/db.js';
import * as candidateModel from '../models/candidateModel.js';
import * as evaluationModel from '../models/evaluationModel.js';
import * as space from '../models/selectorSpaceModel.js';
import * as userModel from '../models/userModel.js';
import * as notificationModel from '../models/notificationModel.js';
import * as logModel from '../models/logModel.js';
import { conflict, notFound } from '../utils/AppError.js';
import { oneOf, optionalText } from '../utils/validators.js';
import { fullName } from '../utils/format.js';
import { buildNavigation, getSelectorStats } from './selectorSpaceService.js';

export async function saveEvaluation(event, user, candidateId, body = {}) {
  const decision = oneOf(body.decision, ['ACCEPTED', 'REJECTED', 'PENDING'], 'decision', { optional: false });
  const comment = optionalText(body.comment, 'comment', 2000);

  if (event.status !== 'OPEN') throw conflict("Les évaluations de cet événement sont verrouillées.", 'EVENT_CLOSED');

  const evaluation = await withTransaction(async (db) => {
    // L'affectation est vérifiée ICI, côté serveur : pas d'affectation = 404.
    const c = await space.findAssigned(event.id, user.id, candidateId, db);
    if (!c) throw notFound('Candidature introuvable.', 'CANDIDATE_NOT_FOUND');

    const before = await candidateModel.isFullyEvaluated(candidateId, db);
    const saved = await evaluationModel.upsert({ candidateId, selectorId: user.id, decision, comment }, db);
    const after = await candidateModel.isFullyEvaluated(candidateId, db);

    if (!before && after) {
      for (const adminId of await userModel.listActiveAdminIds(db)) {
        await notificationModel.insert({
          userId: adminId, eventId: event.id, type: 'CANDIDATE_FULLY_EVALUATED',
          title: 'Candidature complètement évaluée',
          message: `${fullName(c)} (${c.reference}) a reçu toutes ses évaluations.`,
          link: `/events/${event.id}/candidates/${candidateId}`,
        }, db);
      }
    }
    await logModel.insert({
      userId: user.id, eventId: event.id, action: 'EVALUATION_SAVED', entity: 'candidate', entityId: candidateId,
      metadata: { decision },
    }, db);
    return saved;
  });

  // Statistiques et navigation recalculées APRÈS l'enregistrement.
  const [stats, ordered] = await Promise.all([
    getSelectorStats(event.id, user.id),
    space.orderedAssigned(event.id, user.id),
  ]);
  return { evaluation, stats, navigation: buildNavigation(ordered, candidateId) };
}
