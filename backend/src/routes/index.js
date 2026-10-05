import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import authRoutes from './auth.js';
import profileRoutes from './profile.js';
import notificationRoutes from './notifications.js';
import eventRoutes from './events.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/profile', authenticate, profileRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/events', authenticate, eventRoutes);

export default router;
