import { Router } from 'express';
import * as notifications from '../controllers/notificationController.js';

const router = Router();
router.get('/', notifications.list);
router.post('/read-all', notifications.markAllRead);
router.patch('/:id/read', notifications.markRead);
export default router;
