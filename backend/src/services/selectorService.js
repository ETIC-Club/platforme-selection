import * as statsModel from '../models/statsModel.js';
import * as assignmentModel from '../models/assignmentModel.js';
import * as eventModel from '../models/eventModel.js';
import * as logModel from '../models/logModel.js';
import { mapSelectorProgress } from './dashboardService.js';
import { evaluationStatus, fullName } from '../utils/format.js';
import { badRequest, notFound } from '../utils/AppError.js';

export async function listSelectors(event) {
  const rows = (await statsModel.selectorsProgress(event.id)).map(mapSelectorProgress);
  return {
    items: rows,
    summary: {
      total: rows.length,
      rh: rows.filter((s) => s.type === 'RH').length,
      technical: rows.filter((s) => s.type === 'TECHNIQUE').length,
      active: rows.filter((s) => s.isActive).length,
    },
  };
}

export async function getSelector(event, selectorId) {
  const [row] = await statsModel.selectorsProgress(event.id, selectorId);
  if (!row) throw notFound('Sélecteur introuvable pour cet événement.', 'SELECTOR_NOT_FOUND');
  const candidates = await assignmentModel.listForSelector(event.id, selectorId);
  return {
    selector: mapSelectorProgress(row),
    candidates: candidates.map((c) => ({
      candidateId: c.candidateId,
      reference: c.reference,
      fullName: fullName(c),
      track: c.track,
      decision: c.decision,
      evaluationStatus: evaluationStatus(c.decision),
      evaluatedAt: c.evaluatedAt,
    })),
  };
}

export async function setSelectorActive(event, selectorId, body, admin) {
  if (typeof body?.isActive !== 'boolean') throw badRequest('isActive (booléen) requis.', { isActive: 'booléen obligatoire' });
  const updated = await eventModel.setSelectorActive(event.id, selectorId, body.isActive);
  if (!updated) throw notFound('Sélecteur introuvable pour cet événement.', 'SELECTOR_NOT_FOUND');
  await logModel.insert({
    userId: admin.id, eventId: event.id, action: body.isActive ? 'SELECTOR_ACTIVATED' : 'SELECTOR_DEACTIVATED',
    entity: 'user', entityId: selectorId,
  });
  return { id: selectorId, isActive: body.isActive };
}
