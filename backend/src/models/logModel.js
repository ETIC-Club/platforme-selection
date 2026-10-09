import { defaultDb } from './db.js';

export const insert = async ({ userId = null, eventId = null, action, entity = null, entityId = null, metadata = {} }, db = defaultDb) =>
  db.query(
    `INSERT INTO logs (user_id, event_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, eventId, action, entity, entityId, JSON.stringify(metadata)],
  );
