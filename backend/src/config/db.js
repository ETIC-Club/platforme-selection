import pg from 'pg';
import { env } from './env.js';

// COUNT() renvoie un bigint (string par défaut) : on le convertit en nombre.
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
// Les colonnes DATE restent des chaînes "YYYY-MM-DD" (pas de décalage de fuseau).
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: env.databaseUrl });

export const query = (text, params) => pool.query(text, params);

/** Exécute `fn(client)` dans une transaction (COMMIT / ROLLBACK automatiques). */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
