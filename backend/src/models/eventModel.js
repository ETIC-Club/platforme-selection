import { defaultDb } from './db.js';

const COLS = (a = '') => `${a}id, ${a}name, ${a}description, ${a}status, ${a}quota,
  ${a}required_rh AS "requiredRh", ${a}required_technical AS "requiredTechnical", ${a}closes_on AS "closesOn"`;

export const findById = async (id, db = defaultDb) =>
  (await db.query(`SELECT ${COLS()} FROM events WHERE id = $1`, [id])).rows[0] || null;

export const listAll = async (db = defaultDb) =>
  (await db.query(`SELECT ${COLS()} FROM events ORDER BY id DESC`)).rows;

export const listForSelector = async (userId, db = defaultDb) =>
  (await db.query(
    `SELECT ${COLS('e.')}
     FROM events e JOIN event_selectors es ON es.event_id = e.id
     WHERE es.user_id = $1 AND es.is_active ORDER BY e.id DESC`,
    [userId],
  )).rows;

export const isActiveSelector = async (eventId, userId, db = defaultDb) =>
  (await db.query(
    `SELECT 1 FROM event_selectors WHERE event_id = $1 AND user_id = $2 AND is_active`,
    [eventId, userId],
  )).rowCount > 0;

export const listSteps = async (eventId, db = defaultDb) =>
  (await db.query(
    `SELECT id, title, starts_on AS "startsOn", ends_on AS "endsOn"
     FROM event_steps WHERE event_id = $1 ORDER BY sort_order, starts_on`,
    [eventId],
  )).rows;

export const setSelectorActive = async (eventId, userId, isActive, db = defaultDb) =>
  (await db.query(
    `UPDATE event_selectors SET is_active = $3 WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId, isActive],
  )).rowCount;
