import { Router } from 'express';
import { loadEvent } from '../middlewares/loadEvent.js';
import { requireRole } from '../middlewares/requireRole.js';
import * as events from '../controllers/eventController.js';
import * as candidates from '../controllers/candidateController.js';
import * as selectors from '../controllers/selectorController.js';
import * as mySpace from '../controllers/mySpaceController.js';

const router = Router();
const admin = requireRole('ADMIN');
const selector = requireRole('SELECTOR');

// Charge l'événement et vérifie l'accès (un SELECTOR doit y participer) pour toute route :eventId.
router.param('eventId', loadEvent);

router.get('/', events.list);
router.get('/:eventId', events.get);
router.get('/:eventId/search', events.search);

/* ---- ADMIN ---- */
router.get('/:eventId/dashboard', admin, events.adminDashboard);

router.get('/:eventId/candidates', admin, candidates.list);
router.get('/:eventId/candidates/:candidateId', admin, candidates.get);
router.patch('/:eventId/candidates/:candidateId/status', admin, candidates.setStatus);
router.post('/:eventId/candidates/:candidateId/assignments', admin, candidates.assign);
router.delete('/:eventId/candidates/:candidateId/assignments/:selectorId', admin, candidates.unassign);
router.post('/:eventId/assignments/auto', admin, candidates.autoAssign);

router.get('/:eventId/selectors', admin, selectors.list);
router.get('/:eventId/selectors/:selectorId', admin, selectors.get);
router.patch('/:eventId/selectors/:selectorId', admin, selectors.setActive);

/* ---- SELECTOR ---- */
router.get('/:eventId/my-dashboard', selector, events.myDashboard);
router.get('/:eventId/my-candidates', selector, mySpace.list);
router.get('/:eventId/my-candidates/:candidateId', selector, mySpace.get);
router.post('/:eventId/candidates/:candidateId/evaluation', selector, mySpace.saveEvaluation);

export default router;
