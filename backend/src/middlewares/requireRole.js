import { forbidden } from '../utils/AppError.js';

/** Autorise uniquement les rôles listés. À placer APRÈS authenticate. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(forbidden("Votre rôle ne permet pas d'accéder à cette ressource."));
  }
  next();
};
