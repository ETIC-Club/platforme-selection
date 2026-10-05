import { asyncHandler } from '../utils/asyncHandler.js';
import { parseId } from '../utils/validators.js';
import * as selectorSpaceService from '../services/selectorSpaceService.js';
import * as evaluationService from '../services/evaluationService.js';

// Le sélecteur est TOUJOURS req.user (issu du JWT) : aucun identifiant de sélecteur n'est lu dans l'URL.
export const list = asyncHandler(async (req, res) =>
  res.json(await selectorSpaceService.listMyCandidates(req.event, req.user, req.query)));

export const get = asyncHandler(async (req, res) =>
  res.json(await selectorSpaceService.getMyCandidate(req.event, req.user, parseId(req.params.candidateId, 'candidateId'))));

export const saveEvaluation = asyncHandler(async (req, res) =>
  res.json(await evaluationService.saveEvaluation(req.event, req.user, parseId(req.params.candidateId, 'candidateId'), req.body)));
