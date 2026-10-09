import { defaultDb } from './db.js';

export const candidateTotals = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS accepted,
            COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
            COUNT(*) FILTER (WHERE status = 'PENDING')  AS pending,
            COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM assignments a WHERE a.candidate_id = c.id)) AS assigned
     FROM candidates c WHERE event_id = $1`,
    [eventId],
  )).rows[0];

export const evaluationTotals = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT COUNT(*) FILTER (WHERE fully_evaluated) AS "fullyEvaluated",
            COALESCE(SUM(rh_done), 0)::int            AS "rhDone",
            COALESCE(SUM(technical_done), 0)::int     AS "technicalDone",
            COALESCE(SUM(rh_required), 0)::int        AS "rhRequired",
            COALESCE(SUM(technical_required), 0)::int AS "technicalRequired"
     FROM candidate_progress WHERE event_id = $1`,
    [eventId],
  )).rows[0];

export const trackProgress = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT c.track AS name, COUNT(*) AS candidates,
            COALESCE(SUM(p.rh_done + p.technical_done), 0)::int AS completed,
            COALESCE(SUM(p.rh_required + p.technical_required), 0)::int AS required
     FROM candidates c JOIN candidate_progress p ON p.candidate_id = c.id
     WHERE c.event_id = $1 GROUP BY c.track ORDER BY c.track`,
    [eventId],
  )).rows;

/** Progression des sélecteurs de l'événement (un seul si selectorId est fourni). */
export const selectorsProgress = async (eventId, selectorId = null, db = defaultDb) =>
  (await db.query(
    `SELECT u.id, u.name, u.email, u.avatar_url AS "avatarUrl", u.selector_type AS type, es.is_active AS "isActive",
            COUNT(a.id) AS assigned,
            COUNT(e.id) FILTER (WHERE e.decision IN ('ACCEPTED', 'REJECTED')) AS evaluated,
            COUNT(e.id) FILTER (WHERE e.decision = 'ACCEPTED') AS accepted,
            COUNT(e.id) FILTER (WHERE e.decision = 'REJECTED') AS rejected,
            COUNT(e.id) FILTER (WHERE e.decision = 'PENDING')  AS pending
     FROM event_selectors es
     JOIN users u ON u.id = es.user_id
     LEFT JOIN assignments a ON a.selector_id = u.id AND a.event_id = es.event_id
     LEFT JOIN evaluations e ON e.candidate_id = a.candidate_id AND e.selector_id = a.selector_id
     WHERE es.event_id = $1 AND ($2::int IS NULL OR u.id = $2)
     GROUP BY u.id, es.is_active
     ORDER BY u.selector_type, u.name`,
    [eventId, selectorId],
  )).rows;
