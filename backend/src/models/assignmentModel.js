import { defaultDb } from './db.js';

export const exists = async (candidateId, selectorId, db = defaultDb) =>
  (await db.query(`SELECT 1 FROM assignments WHERE candidate_id = $1 AND selector_id = $2`, [candidateId, selectorId])).rowCount > 0;

export const insert = async ({ eventId, candidateId, selectorId }, db = defaultDb) =>
  db.query(
    `INSERT INTO assignments (event_id, candidate_id, selector_id) VALUES ($1, $2, $3)`,
    [eventId, candidateId, selectorId],
  );

export const remove = async (candidateId, selectorId, db = defaultDb) =>
  (await db.query(`DELETE FROM assignments WHERE candidate_id = $1 AND selector_id = $2`, [candidateId, selectorId])).rowCount;

/** Affectations d'une candidature, avec l'évaluation éventuelle (vue Admin). */
export const listForCandidate = async (candidateId, db = defaultDb) =>
  (await db.query(
    `SELECT a.selector_id AS "selectorId", u.name, u.email, u.selector_type AS type, a.assigned_at AS "assignedAt",
            e.decision, e.comment, e.evaluated_at AS "evaluatedAt"
     FROM assignments a
     JOIN users u ON u.id = a.selector_id
     LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
     WHERE a.candidate_id = $1
     ORDER BY u.selector_type, u.name`,
    [candidateId],
  )).rows;

/** Candidatures d'un sélecteur avec sa décision (vue Admin d'un sélecteur). */
export const listForSelector = async (eventId, selectorId, db = defaultDb) =>
  (await db.query(
    `SELECT c.id AS "candidateId", c.reference, c.first_name AS "firstName", c.last_name AS "lastName", c.track,
            e.decision, e.evaluated_at AS "evaluatedAt"
     FROM assignments a
     JOIN candidates c ON c.id = a.candidate_id
     LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
     WHERE a.event_id = $1 AND a.selector_id = $2
     ORDER BY c.submitted_at, c.id`,
    [eventId, selectorId],
  )).rows;

/** Pour l'affectation automatique. */
export const candidatesWithCounts = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT c.id, c.reference,
            COUNT(a.id) FILTER (WHERE u.selector_type = 'RH')        AS "rhAssigned",
            COUNT(a.id) FILTER (WHERE u.selector_type = 'TECHNIQUE') AS "technicalAssigned",
            COALESCE(array_agg(a.selector_id) FILTER (WHERE a.id IS NOT NULL), '{}') AS "selectorIds"
     FROM candidates c
     LEFT JOIN assignments a ON a.candidate_id = c.id
     LEFT JOIN users u ON u.id = a.selector_id
     WHERE c.event_id = $1
     GROUP BY c.id ORDER BY c.submitted_at, c.id`,
    [eventId],
  )).rows;

export const selectorLoads = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT u.id, u.name, u.selector_type AS type, COUNT(a.id) AS load
     FROM event_selectors es
     JOIN users u ON u.id = es.user_id AND u.is_active
     LEFT JOIN assignments a ON a.selector_id = u.id AND a.event_id = es.event_id
     WHERE es.event_id = $1 AND es.is_active
     GROUP BY u.id ORDER BY u.id`,
    [eventId],
  )).rows;
