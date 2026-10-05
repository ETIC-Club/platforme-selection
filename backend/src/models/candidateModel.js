import { defaultDb } from './db.js';
import { likePattern } from '../utils/validators.js';

const SORTS = {
  submittedAt: 'c.submitted_at',
  name: 'c.last_name, c.first_name',
  track: 'c.track',
  status: 'c.status',
  progress: '(p.rh_done + p.technical_done)',
};
export const SORT_KEYS = Object.keys(SORTS);

/** Candidature complète (usage Admin). */
export const findInEvent = async (eventId, candidateId, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.email, c.phone,
            c.track, c.school, c.study_level AS "studyLevel", c.motivation, c.experience, c.skills,
            c.github_url AS "githubUrl", c.portfolio_url AS "portfolioUrl", c.technical_answer AS "technicalAnswer",
            c.status, c.decided_at AS "decidedAt", u.name AS "decidedByName", c.submitted_at AS "submittedAt",
            p.rh_done AS "rhDone", p.technical_done AS "technicalDone",
            p.rh_required AS "rhRequired", p.technical_required AS "technicalRequired",
            p.fully_evaluated AS "fullyEvaluated"
     FROM candidates c
     JOIN candidate_progress p ON p.candidate_id = c.id
     LEFT JOIN users u ON u.id = c.decided_by
     WHERE c.event_id = $1 AND c.id = $2`,
    [eventId, candidateId],
  )).rows[0] || null;

export async function adminList(eventId, f, db = defaultDb) {
  const params = [eventId];
  const where = ['c.event_id = $1'];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };

  if (f.search) {
    params.push(likePattern(f.search));
    const i = `$${params.length}`;
    where.push(`(c.first_name || ' ' || c.last_name ILIKE ${i} OR c.last_name || ' ' || c.first_name ILIKE ${i}
                 OR c.reference ILIKE ${i} OR c.email ILIKE ${i})`);
  }
  if (f.track) add('c.track = ?', f.track);
  if (f.status) add('c.status = ?', f.status);
  if (f.evaluation === 'COMPLETE') where.push('p.fully_evaluated');
  if (f.evaluation === 'INCOMPLETE') where.push('NOT p.fully_evaluated');
  if (f.assigned === 'true') where.push('EXISTS (SELECT 1 FROM assignments a WHERE a.candidate_id = c.id)');
  if (f.assigned === 'false') where.push('NOT EXISTS (SELECT 1 FROM assignments a WHERE a.candidate_id = c.id)');

  const whereSql = where.join(' AND ');
  const from = 'FROM candidates c JOIN candidate_progress p ON p.candidate_id = c.id';
  const total = (await db.query(`SELECT COUNT(*) AS n ${from} WHERE ${whereSql}`, params)).rows[0].n;

  const dir = f.order === 'desc' ? 'DESC' : 'ASC';
  const orderBy = SORTS[f.sort] || SORTS.submittedAt;
  const sortSql = orderBy.split(', ').map((col) => `${col} ${dir}`).join(', ');

  const rows = (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track, c.status,
            c.submitted_at AS "submittedAt",
            (SELECT COUNT(*) FROM assignments a WHERE a.candidate_id = c.id) AS "assignedCount",
            p.rh_done + p.technical_done AS completed,
            p.rh_required + p.technical_required AS required,
            p.fully_evaluated AS "fullyEvaluated"
     ${from} WHERE ${whereSql}
     ORDER BY ${sortSql}, c.id ASC
     LIMIT ${f.pageSize} OFFSET ${f.offset}`,
    params,
  )).rows;
  return { rows, total };
}

export const distinctTracks = async (eventId, db = defaultDb) =>
  (await db.query(`SELECT DISTINCT track FROM candidates WHERE event_id = $1 ORDER BY track`, [eventId]))
    .rows.map((r) => r.track);

/** Liste courte (candidatures récentes / en attente) avec progression. */
export const listShort = async (eventId, { status, order = 'DESC', limit = 5 }, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track, c.status,
            c.submitted_at AS "submittedAt",
            (SELECT COUNT(*) FROM assignments a WHERE a.candidate_id = c.id) AS "assignedCount",
            p.rh_done + p.technical_done AS completed, p.rh_required + p.technical_required AS required
     FROM candidates c JOIN candidate_progress p ON p.candidate_id = c.id
     WHERE c.event_id = $1 AND ($2::text IS NULL OR c.status = $2)
     ORDER BY c.submitted_at ${order === 'ASC' ? 'ASC' : 'DESC'}, c.id
     LIMIT $3`,
    [eventId, status || null, limit],
  )).rows;

export const setStatus = async (candidateId, status, adminId, db = defaultDb) =>
  db.query(
    `UPDATE candidates SET status = $2, decided_by = $3, decided_at = now() WHERE id = $1`,
    [candidateId, status, adminId],
  );

export const countAccepted = async (eventId, db = defaultDb) =>
  (await db.query(`SELECT COUNT(*) AS n FROM candidates WHERE event_id = $1 AND status = 'ACCEPTED'`, [eventId])).rows[0].n;

export const isFullyEvaluated = async (candidateId, db = defaultDb) =>
  (await db.query(`SELECT fully_evaluated AS ok FROM candidate_progress WHERE candidate_id = $1`, [candidateId])).rows[0]?.ok === true;

/** Recherche globale (Admin). */
export const search = async (eventId, text, limit, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track, c.status
     FROM candidates c
     WHERE c.event_id = $1 AND (c.first_name || ' ' || c.last_name ILIKE $2 OR c.last_name || ' ' || c.first_name ILIKE $2
                                OR c.reference ILIKE $2 OR c.track ILIKE $2)
     ORDER BY c.last_name, c.first_name LIMIT $3`,
    [eventId, likePattern(text), limit],
  )).rows;
