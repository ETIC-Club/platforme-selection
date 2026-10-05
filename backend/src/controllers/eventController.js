import { asyncHandler } from '../utils/asyncHandler.js';
import * as eventService from '../services/eventService.js';
import * as dashboardService from '../services/dashboardService.js';
import * as selectorSpaceService from '../services/selectorSpaceService.js';
import * as searchService from '../services/searchService.js';

export const list = asyncHandler(async (req, res) => res.json(await eventService.listEvents(req.user)));

export const get = asyncHandler(async (req, res) =>
  res.json({ event: eventService.formatEvent(req.event), nextSteps: await eventService.getNextSteps(req.event.id) }));

export const adminDashboard = asyncHandler(async (req, res) => res.json(await dashboardService.getAdminDashboard(req.event)));

export const myDashboard = asyncHandler(async (req, res) =>
  res.json(await selectorSpaceService.getMyDashboard(req.event, req.user)));

export const search = asyncHandler(async (req, res) =>
  res.json(await searchService.globalSearch(req.event, req.user, req.query.q)));
