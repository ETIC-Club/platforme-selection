import { defaultDb } from './db.js';
import { likePattern } from '../utils/validators.js';

const SORTS = {
  submittedAt: 'c.submitted_at',
  name: 'c.last_name, c.first_name',
  track: 'c.track',
  evaluatedAt: 'e.evaluated_at',
};
export const SORT_KEYS = Object.keys(SORTS);

/** Candidatures affectées à CE sélecteur uniquement (selectorId vient toujours du JWT). */
export async function listAssigned(eventId, selectorId, f, db = defaultDb) {
  const params = [eventId, selectorId];
  const where = ['a.event_id = $1', 'a.selector_id = $2'];

  if (f.search) {
    params.push(likePattern(f.search));
    const i = `$${params.length}`;
    where.push(`(c.first_name || ' ' || c.last_name ILIKE ${i} OR c.last_name || ' ' || c.first_name ILIKE ${i} OR c.reference ILIKE ${i})`);
  }
  if (f.track) { params.push(f.track); where.push(`c.track = $${params.length}`); }
  if (f.decision === 'NOT_STARTED') where.push('e.id IS NULL');
  else if (f.decision === 'TODO') where.push(`(e.id IS NULL OR e.decision = 'PENDING')`);
  else if (f.decision) { params.push(f.decision); where.push(`e.decision = $${params.length}`); }

  const from = `FROM assignments a
    JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
    WHERE ${where.join(' AND ')}`;
  const total = (await db.query(`SELECT COUNT(*) AS n ${from}`, params)).rows[0].n;

  const dir = f.order === 'desc' ? 'DESC' : 'ASC';
  const sortSql = (SORTS[f.sort] || SORTS.submittedAt).split(', ').map((c) => `${c} ${dir}`).join(', ');
  const nulls = f.sort === 'evaluatedAt' ? ' NULLS LAST' : '';

  const rows = (await db.query(
    `SELECT c.id AS "candidateId", c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track,
            c.submitted_at AS "submittedAt", a.assigned_at AS "assignedAt",
            e.decision, e.evaluated_at AS "evaluatedAt"
     ${from}
     ORDER BY ${sortSql}${nulls}, c.id ASC
     LIMIT ${f.pageSize} OFFSET ${f.offset}`,
    params,
  )).rows;
  return { rows, total };
}

export const distinctTracks = async (eventId, selectorId, db = defaultDb) =>
  (await db.query(
    `SELECT DISTINCT c.track FROM assignments a JOIN candidates c ON c.id = a.candidate_id
     WHERE a.event_id = $1 AND a.selector_id = $2 ORDER BY c.track`,
    [eventId, selectorId],
  )).rows.map((r) => r.track);

/** Ordre stable utilisé pour la navigation précédente / suivante. */
export const orderedAssigned = async (eventId, selectorId, db = defaultDb) =>
  (await db.query(
    `SELECT c.id AS "candidateId", e.decision
     FROM assignments a
     JOIN candidates c ON c.id = a.candidate_id
     LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
     WHERE a.event_id = $1 AND a.selector_id = $2
     ORDER BY c.submitted_at ASC, c.id ASC`,
    [eventId, selectorId],
  )).rows;

/** Renvoie null si la candidature n'est PAS affectée à ce sélecteur. */
export const findAssigned = async (eventId, selectorId, candidateId, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track, c.school,
            c.study_level AS "studyLevel", c.motivation, c.experience, c.skills,
            c.github_url AS "githubUrl", c.portfolio_url AS "portfolioUrl", c.technical_answer AS "technicalAnswer",
            c.submitted_at AS "submittedAt",
            e.decision, e.comment, e.evaluated_at AS "evaluatedAt"
     FROM assignments a
     JOIN candidates c ON c.id = a.candidate_id
     LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
     WHERE a.event_id = $1 AND a.selector_id = $2 AND a.candidate_id = $3`,
    [eventId, selectorId, candidateId],
  )).rows[0] || null;

export const latestEvaluated = async (eventId, selectorId, limit, db = defaultDb) =>
  (await db.query(
    `SELECT c.id AS "candidateId", c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track,
            e.decision, e.evaluated_at AS "evaluatedAt"
     FROM evaluations e JOIN candidates c ON c.id = e.candidate_id
     WHERE c.event_id = $1 AND e.selector_id = $2
     ORDER BY e.evaluated_at DESC LIMIT $3`,
    [eventId, selectorId, limit],
  )).rows;

export const search = async (eventId, selectorId, text, limit, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track
     FROM assignments a JOIN candidates c ON c.id = a.candidate_id
     WHERE a.event_id = $1 AND a.selector_id = $2
       AND (c.first_name || ' ' || c.last_name ILIKE $3 OR c.last_name || ' ' || c.first_name ILIKE $3 OR c.reference ILIKE $3)
     ORDER BY c.last_name, c.first_name LIMIT $4`,
    [eventId, selectorId, likePattern(text), limit],
  )).rows;
