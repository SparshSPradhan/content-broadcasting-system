import { Router } from 'express';
import * as broadcastingController from './broadcasting.controller';
import { publicApiRateLimit } from '../../middlewares/rateLimit.middleware';

const router = Router();

// Apply stricter rate limiting to public endpoints
router.use(publicApiRateLimit);

/**
 * @swagger
 * /content/live/{teacherId}:
 *   get:
 *     tags: [Broadcasting - Public]
 *     summary: Get live/active content for a specific teacher (Public endpoint - no auth required)
 *     description: |
 *       Returns the currently active content based on time-window and rotation logic.
 *       - Supports teacher UUID or sequential format (teacher-1, teacher-2, etc.)
 *       - Returns "No content available" if no approved+scheduled content exists
 *       - Results are cached in Redis for performance
 *       - Subject-based rotation is independent per subject
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher UUID or sequential ID (teacher-1, teacher-2, ...)
 *         examples:
 *           uuid:
 *             value: "550e8400-e29b-41d4-a716-446655440000"
 *           sequential:
 *             value: "teacher-1"
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Optional subject filter (maths, science, etc.)
 *     responses:
 *       200:
 *         description: Live content or no content available
 *         content:
 *           application/json:
 *             examples:
 *               withContent:
 *                 value:
 *                   success: true
 *                   available: true
 *                   message: "Live content retrieved"
 *                   teacher:
 *                     id: "uuid"
 *                     name: "Teacher One"
 *                   data:
 *                     - id: "uuid"
 *                       title: "Maths Chapter 1"
 *                       subject: "maths"
 *               noContent:
 *                 value:
 *                   success: true
 *                   available: false
 *                   message: "No content available"
 *                   data: null
 */
router.get('/:teacherId', broadcastingController.getLiveContent);

export default router;