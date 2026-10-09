import * as eventModel from '../models/eventModel.js';

export const formatEvent = (e) => ({
  id: e.id,
  name: e.name,
  description: e.description,
  status: e.status, // OPEN | CLOSED (CLOSED = évaluations verrouillées)
  quota: e.quota,
  closesOn: e.closesOn,
  requiredEvaluations: { rh: e.requiredRh, technical: e.requiredTechnical },
});

export async function listEvents(user) {
  const events = user.role === 'ADMIN' ? await eventModel.listAll() : await eventModel.listForSelector(user.id);
  return { items: events.map(formatEvent) };
}

const DAY = 24 * 60 * 60 * 1000;
const toDay = (s) => Date.parse(`${s}T00:00:00Z`);

/**
 * Prochaines étapes avec un état calculé :
 * DONE (terminée) | SOON (dans 7 jours ou moins, daysLeft fourni) | ONGOING | UPCOMING (à venir)
 */
export async function getNextSteps(eventId, now = new Date()) {
  const today = toDay(now.toISOString().slice(0, 10));
  const steps = await eventModel.listSteps(eventId);
  return steps.map((s) => {
    const start = toDay(s.startsOn);
    const end = s.endsOn ? toDay(s.endsOn) : start;
    const daysLeft = Math.round((start - today) / DAY);
    let state = 'UPCOMING';
    if (end < today) state = 'DONE';
    else if (start <= today) state = 'ONGOING';
    else if (daysLeft <= 7) state = 'SOON';
    return {
      id: s.id,
      title: s.title,
      startsOn: s.startsOn,
      endsOn: s.endsOn,
      state,
      daysLeft: state === 'SOON' ? daysLeft : null,
    };
  });
}
