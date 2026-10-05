import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

export const devUsers = asyncHandler(async (_req, res) => res.json(await authService.listDevUsers()));
export const devLogin = asyncHandler(async (req, res) => res.json(await authService.devLogin(req.body || {})));
export const google = asyncHandler(async (req, res) => res.json(await authService.googleLogin(req.body || {})));
