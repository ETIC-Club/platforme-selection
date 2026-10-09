import { parseId } from '../utils/validators.js';
import { notFound, forbidden } from '../utils/AppError.js';
import * as eventModel from '../models/eventModel.js';

/**
 * Callback `router.param('eventId', loadEvent)`.
 * - charge l'événement (404 sinon) dans req.event
 * - un SELECTOR doit participer (et être actif) à cet événement, sinon 403
 */
export async function loadEvent(req, _res, next, value) {
  try {
    const eventId = parseId(value, 'eventId');
    const event = await eventModel.findById(eventId);
    if (!event) throw notFound('Événement introuvable.', 'EVENT_NOT_FOUND');

    if (req.user.role === 'SELECTOR') {
      const allowed = await eventModel.isActiveSelector(eventId, req.user.id);
      if (!allowed) throw forbidden("Vous n'avez pas accès à cet événement.", 'EVENT_ACCESS_DENIED');
    }
    req.event = event;
    next();
  } catch (err) {
    next(err);
  }
}
