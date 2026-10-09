import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route inconnue : ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Corps JSON invalide.' } });
  }
  // Violations de contraintes PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Cette ressource existe déjà.' } });
  }
  if (err.code === '23503' || err.code === '23514') {
    return res.status(409).json({ error: { code: 'CONSTRAINT_VIOLATION', message: 'Opération refusée : données incohérentes.' } });
  }
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.nodeEnv === 'production' ? 'Erreur interne du serveur.' : err.message,
    },
  });
};
