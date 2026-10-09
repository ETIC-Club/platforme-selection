import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError, badRequest, forbidden, notFound } from '../utils/AppError.js';
import * as userModel from '../models/userModel.js';
import * as logModel from '../models/logModel.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/* ------------------------------------------------------------------ *
 *  MODE DÉVELOPPEMENT (AUTH_MODE=dev) — utilisateurs simulés.
 *  Totalement séparé de l'authentification réelle : les routes
 *  /auth/dev-* ne sont même pas montées si AUTH_MODE != dev.
 * ------------------------------------------------------------------ */
export async function listDevUsers() {
  return { items: await userModel.listAll() };
}

export async function devLogin({ userId, email }) {
  let user = null;
  if (userId) user = await userModel.findById(Number(userId));
  else if (email) user = await userModel.findByEmail(String(email));
  else throw badRequest('userId ou email requis.');

  if (!user) throw notFound('Utilisateur introuvable.', 'USER_NOT_FOUND');
  if (!user.isActive) throw forbidden('Ce compte est désactivé.', 'ACCOUNT_DISABLED');

  await logModel.insert({ userId: user.id, action: 'AUTH_DEV_LOGIN', entity: 'user', entityId: user.id });
  return { token: signToken(user), user };
}

/* ------------------------------------------------------------------ *
 *  AUTHENTIFICATION GOOGLE (à brancher)
 *  Plan d'intégration :
 *   1. Le frontend obtient un `idToken` via Google Identity Services.
 *   2. Il l'envoie à POST /api/auth/google { idToken }.
 *   3. verifyGoogleIdToken() le valide (package `google-auth-library`,
 *      OAuth2Client.verifyIdToken avec GOOGLE_CLIENT_ID) et renvoie { email }.
 *   4. On retrouve l'utilisateur par email (liste blanche : seuls les comptes
 *      créés par l'Admin peuvent se connecter) puis on signe notre propre JWT.
 * ------------------------------------------------------------------ */
// eslint-disable-next-line no-unused-vars
async function verifyGoogleIdToken(idToken) {
  throw new AppError(501, 'NOT_IMPLEMENTED', "L'authentification Google n'est pas encore branchée (voir src/services/authService.js).");
}

export async function googleLogin({ idToken }) {
  if (!idToken) throw badRequest('idToken requis.');
  const { email } = await verifyGoogleIdToken(idToken);
  const user = await userModel.findByEmail(email);
  if (!user) throw forbidden("Ce compte Google n'est pas autorisé sur la plateforme.", 'USER_NOT_ALLOWED');
  if (!user.isActive) throw forbidden('Ce compte est désactivé.', 'ACCOUNT_DISABLED');
  await logModel.insert({ userId: user.id, action: 'AUTH_GOOGLE_LOGIN', entity: 'user', entityId: user.id });
  return { token: signToken(user), user };
}
