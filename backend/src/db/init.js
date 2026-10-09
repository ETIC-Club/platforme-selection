import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../config/db.js';

const here = dirname(fileURLToPath(import.meta.url));
const drop = process.argv.includes('--drop');

try {
  if (drop) {
    await pool.query(`
      DROP VIEW IF EXISTS candidate_progress;
      DROP TABLE IF EXISTS logs, notifications, evaluations, assignments, candidates,
                           event_selectors, event_steps, events, users CASCADE;
    `);
    console.log('Tables supprimées.');
  }
  await pool.query(readFileSync(join(here, 'schema.sql'), 'utf8'));
  console.log('Schéma créé.');
} catch (err) {
  console.error('Erreur lors de l\'initialisation de la base :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
