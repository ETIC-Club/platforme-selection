export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(422, 'VALIDATION_ERROR', message, details);
export const unauthorized = (message = 'Authentification requise.', code = 'UNAUTHORIZED') => new AppError(401, code, message);
export const forbidden = (message = "Vous n'avez pas accès à cette ressource.", code = 'FORBIDDEN') => new AppError(403, code, message);
export const notFound = (message = 'Ressource introuvable.', code = 'NOT_FOUND') => new AppError(404, code, message);
export const conflict = (message, code = 'CONFLICT') => new AppError(409, code, message);
