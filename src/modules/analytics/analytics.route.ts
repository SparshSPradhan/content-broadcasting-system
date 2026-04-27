import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { isPrincipal, isTeacher, isPrincipalOrTeacher } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/analytics/global:
 *   get:
 *     tags: [Analytics]
 *     summary: Global analytics - most active subjects, daily trends (Principal only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Global analytics data
 */
router.get('/global', isPrincipal, analyticsController.getGlobalAnalytics);

/**
 * @swagger
 * /api/analytics/subjects:
 *   get:
 *     tags: [Analytics]
 *     summary: Most active subjects by view count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subjects ranked by views
 */
router.get('/subjects', isPrincipal, analyticsController.getMostActiveSubjects);

/**
 * @swagger
 * /api/analytics/me:
 *   get:
 *     tags: [Analytics]
 *     summary: Teacher's own analytics summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher analytics summary
 */
router.get('/me', isTeacher, analyticsController.getMyAnalytics);

/**
 * @swagger
 * /api/analytics/usage:
 *   get:
 *     tags: [Analytics]
 *     summary: Content usage tracking with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Principal only - filter by teacher
 *     responses:
 *       200:
 *         description: Content usage data
 */
router.get('/usage', isPrincipalOrTeacher, analyticsController.getContentUsage);

export default router;