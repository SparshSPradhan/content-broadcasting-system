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



// import { Router, Request, Response } from 'express';
// import authRoutes from '../modules/auth/auth.route';
// import contentRoutes from '../modules/content/content.route';
// import broadcastingRoutes from '../modules/broadcasting/broadcasting.route';
// import analyticsRoutes from '../modules/analytics/analytics.route';
// import userRoutes from '../modules/users/user.route';
// import schedulingRoutes from '../modules/scheduling/scheduling.route';

// // ── Public router (NO auth middleware anywhere in this chain) ──────────────
// // MUST be a separate Router instance, mounted BEFORE the API router.
// // This prevents Express from ever running authenticate() on public routes.
// const publicRouter = Router();

// publicRouter.get('/health', (_req: Request, res: Response) => {
//   res.status(200).json({
//     success: true,
//     message: 'Content Broadcasting System is running',
//     timestamp: new Date().toISOString(),
//     version: process.env.npm_package_version ?? '1.0.0',
//   });
// });

// // ⚠️  Public endpoint — no auth, no /api prefix
// // Students hit: GET /content/live/:teacherId
// publicRouter.use('/content/live', broadcastingRoutes);

// // ── Private router (all routes under /api require auth at the route level) ─
// const apiRouter = Router();

// apiRouter.use('/api/auth', authRoutes);
// apiRouter.use('/api/content', contentRoutes);      // authenticate applied inside content.route.ts
// apiRouter.use('/api/analytics', analyticsRoutes);
// apiRouter.use('/api/users', userRoutes);
// apiRouter.use('/api/scheduling', schedulingRoutes);

// // ── Combined export ────────────────────────────────────────────────────────
// // app.ts does: app.use(routes)
// // We export a single router that first mounts public, then private.
// const router = Router();
// router.use(publicRouter);   // public first — /health, /content/live/*
// router.use(apiRouter);      // private second — /api/*

// export default router;