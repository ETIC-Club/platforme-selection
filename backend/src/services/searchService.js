import * as candidateModel from '../models/candidateModel.js';
import * as statsModel from '../models/statsModel.js';
import * as space from '../models/selectorSpaceModel.js';
import { fullName } from '../utils/format.js';

const LIMIT = 6;

/** Recherche du header : l'Admin cherche candidats + sélecteurs, le Sélecteur uniquement SES candidatures. */
export async function globalSearch(event, user, rawQuery) {
  const q = String(rawQuery || '').trim().slice(0, 100);
  if (q.length < 2) return { query: q, candidates: [], selectors: [] };

  const toCandidate = (c) => ({ id: c.id, reference: c.reference, fullName: fullName(c), track: c.track, status: c.status });

  if (user.role === 'ADMIN') {
    const needle = q.toLowerCase();
    const [candidates, selectors] = await Promise.all([
      candidateModel.search(event.id, q, LIMIT),
      statsModel.selectorsProgress(event.id),
    ]);
    return {
      query: q,
      candidates: candidates.map(toCandidate),
      selectors: selectors
        .filter((s) => s.name.toLowerCase().includes(needle) || s.email.toLowerCase().includes(needle))
        .slice(0, LIMIT)
        .map((s) => ({ id: s.id, name: s.name, email: s.email, type: s.type })),
    };
  }

  const candidates = await space.search(event.id, user.id, q, LIMIT);
  return { query: q, candidates: candidates.map((c) => ({ ...toCandidate(c), status: undefined })), selectors: [] };
}
