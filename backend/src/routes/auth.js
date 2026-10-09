import { Router } from 'express';
import { env } from '../config/env.js';
import * as auth from '../controllers/authController.js';

const router = Router();

// Authentification réelle (Google) — à brancher dans authService.
router.post('/google', auth.google);

// Mode développement : montées UNIQUEMENT si AUTH_MODE=dev.
if (env.authMode === 'dev') {
  router.get('/dev-users', auth.devUsers);
  router.post('/dev-login', auth.devLogin);
}

export default router;
