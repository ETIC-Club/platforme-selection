import { asyncHandler } from '../utils/asyncHandler.js';
import { parseId } from '../utils/validators.js';
import * as candidateService from '../services/candidateService.js';
import * as assignmentService from '../services/assignmentService.js';

export const list = asyncHandler(async (req, res) => res.json(await candidateService.listCandidates(req.event, req.query)));

export const get = asyncHandler(async (req, res) =>
  res.json(await candidateService.getCandidate(req.event, parseId(req.params.candidateId, 'candidateId'))));

export const setStatus = asyncHandler(async (req, res) =>
  res.json(await candidateService.setFinalStatus(req.event, parseId(req.params.candidateId, 'candidateId'), req.body, req.user)));

export const assign = asyncHandler(async (req, res) =>
  res.status(201).json(await assignmentService.assign(req.event, parseId(req.params.candidateId, 'candidateId'), req.body, req.user)));

export const unassign = asyncHandler(async (req, res) => {
  await assignmentService.unassign(
    req.event, parseId(req.params.candidateId, 'candidateId'), parseId(req.params.selectorId, 'selectorId'), req.user,
  );
  res.status(204).end();
});

export const autoAssign = asyncHandler(async (req, res) => res.json(await assignmentService.autoAssign(req.event, req.user)));
