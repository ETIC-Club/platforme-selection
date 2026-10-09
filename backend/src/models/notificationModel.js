import { defaultDb } from './db.js';

export const insert = async ({ userId, eventId = null, type, title, message, link = null }, db = defaultDb) =>
  db.query(
    `INSERT INTO notifications (user_id, event_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, eventId, type, title, message, link],
  );

export const listForUser = async (userId, { unreadOnly, limit }, db = defaultDb) =>
  (await db.query(
    `SELECT id, type, title, message, link, is_read AS "isRead", created_at AS "createdAt", event_id AS "eventId"
     FROM notifications WHERE user_id = $1 AND ($2::boolean = FALSE OR NOT is_read)
     ORDER BY created_at DESC, id DESC LIMIT $3`,
    [userId, !!unreadOnly, limit],
  )).rows;

export const unreadCount = async (userId, db = defaultDb) =>
  (await db.query(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1 AND NOT is_read`, [userId])).rows[0].n;

export const markRead = async (id, userId, db = defaultDb) =>
  (await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [id, userId])).rowCount;

export const markAllRead = async (userId, db = defaultDb) =>
  db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND NOT is_read`, [userId]);
