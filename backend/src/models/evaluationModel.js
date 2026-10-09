import { defaultDb } from './db.js';

/** Crée ou met à jour l'évaluation du sélecteur (une seule par candidature et par sélecteur). */
export const upsert = async ({ candidateId, selectorId, decision, comment }, db = defaultDb) =>
  (await db.query(
    `INSERT INTO evaluations (candidate_id, selector_id, decision, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (candidate_id, selector_id)
     DO UPDATE SET decision = EXCLUDED.decision, comment = EXCLUDED.comment, evaluated_at = now()
     RETURNING candidate_id AS "candidateId", decision, comment, evaluated_at AS "evaluatedAt"`,
    [candidateId, selectorId, decision, comment ?? null],
  )).rows[0];

export const isCompleted = async (candidateId, selectorId, db = defaultDb) =>
  (await db.query(
    `SELECT 1 FROM evaluations WHERE candidate_id = $1 AND selector_id = $2 AND decision IN ('ACCEPTED', 'REJECTED')`,
    [candidateId, selectorId],
  )).rowCount > 0;

export const existsAny = async (candidateId, selectorId, db = defaultDb) =>
  (await db.query(`SELECT 1 FROM evaluations WHERE candidate_id = $1 AND selector_id = $2`, [candidateId, selectorId])).rowCount > 0;
