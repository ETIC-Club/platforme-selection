import { query } from '../config/db.js';

/** Exécuteur par défaut ; les modèles acceptent aussi un `client` de transaction. */
export const defaultDb = { query };
