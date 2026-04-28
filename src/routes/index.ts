import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.route';
import contentRoutes from '../modules/content/content.route';
import broadcastingRoutes from '../modules/broadcasting/broadcasting.route';
import analyticsRoutes from '../modules/analytics/analytics.route';
import userRoutes from '../modules/users/user.route';
import schedulingRoutes from '../modules/scheduling/scheduling.route';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Content Broadcasting System is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/content', contentRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/users', userRoutes);
router.use('/api/scheduling', schedulingRoutes);

// Public broadcasting routes (no /api prefix, no auth)
router.use('/content/live', broadcastingRoutes);

export default router;


