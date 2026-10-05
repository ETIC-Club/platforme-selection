import { defaultDb } from './db.js';

const COLS = `id, name, email, role, selector_type AS "selectorType", avatar_url AS "avatarUrl", is_active AS "isActive"`;

export const findById = async (id, db = defaultDb) =>
  (await db.query(`SELECT ${COLS} FROM users WHERE id = $1`, [id])).rows[0] || null;

export const findByEmail = async (email, db = defaultDb) =>
  (await db.query(`SELECT ${COLS} FROM users WHERE lower(email) = lower($1)`, [email])).rows[0] || null;

export const listAll = async (db = defaultDb) =>
  (await db.query(`SELECT ${COLS} FROM users WHERE is_active ORDER BY role, selector_type NULLS FIRST, name`)).rows;

export const listActiveAdminIds = async (db = defaultDb) =>
  (await db.query(`SELECT id FROM users WHERE role = 'ADMIN' AND is_active`)).rows.map((r) => r.id);
