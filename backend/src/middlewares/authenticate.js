import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as userModel from '../models/userModel.js';

/** Vérifie le JWT puis recharge l'utilisateur en base (rôle et activation toujours à jour). */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized('Session expirée ou invalide. Reconnectez-vous.', 'INVALID_TOKEN');
  }

  const user = await userModel.findById(Number(payload.sub));
  if (!user) throw unauthorized('Utilisateur introuvable.', 'INVALID_TOKEN');
  if (!user.isActive) throw forbidden('Ce compte est désactivé.', 'ACCOUNT_DISABLED');

  req.user = user;
  next();
});
