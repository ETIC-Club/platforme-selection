import { asyncHandler } from '../utils/asyncHandler.js';
import { parseId } from '../utils/validators.js';
import * as notificationService from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) => res.json(await notificationService.list(req.user, req.query)));
export const markRead = asyncHandler(async (req, res) =>
  res.json(await notificationService.markRead(req.user, parseId(req.params.id, 'id'))));
export const markAllRead = asyncHandler(async (req, res) => res.json(await notificationService.markAllRead(req.user)));
