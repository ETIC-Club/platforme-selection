import { asyncHandler } from '../utils/asyncHandler.js';
import { parseId } from '../utils/validators.js';
import * as selectorService from '../services/selectorService.js';

export const list = asyncHandler(async (req, res) => res.json(await selectorService.listSelectors(req.event)));

export const get = asyncHandler(async (req, res) =>
  res.json(await selectorService.getSelector(req.event, parseId(req.params.selectorId, 'selectorId'))));

export const setActive = asyncHandler(async (req, res) =>
  res.json(await selectorService.setSelectorActive(req.event, parseId(req.params.selectorId, 'selectorId'), req.body, req.user)));
