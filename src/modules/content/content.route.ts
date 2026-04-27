import { Router } from 'express';
import * as contentController from './content.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { isPrincipal, isTeacher, isPrincipalOrTeacher } from '../../middlewares/rbac.middleware';
import { validateBody, validateQuery } from '../../middlewares/validate.middleware';
import { uploadSingle } from '../../middlewares/upload.middleware';
import {
  uploadContentSchema,
  approveContentSchema,
  contentQuerySchema,
} from './content.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Teacher routes ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/content/upload:
 *   post:
 *     tags: [Content]
 *     summary: Upload content (Teacher only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, subject, file]
 *             properties:
 *               title:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               rotationDuration:
 *                 type: number
 *                 description: Minutes per rotation slot
 *     responses:
 *       201:
 *         description: Content uploaded
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not a teacher
 */
router.post(
  '/upload',
  isTeacher,
  uploadSingle,
  validateBody(uploadContentSchema),
  contentController.uploadContent,
);

/**
 * @swagger
 * /api/content/my:
 *   get:
 *     tags: [Content]
 *     summary: Get teacher's own content with pagination & filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploaded, pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Paginated content list
 */
router.get('/my', isTeacher, validateQuery(contentQuerySchema), contentController.getTeacherContent);

// ── Principal routes ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/content:
 *   get:
 *     tags: [Content]
 *     summary: Get all content (Principal only) with pagination & filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All content
 */
router.get('/', isPrincipal, validateQuery(contentQuerySchema), contentController.getAllContent);

/**
 * @swagger
 * /api/content/pending:
 *   get:
 *     tags: [Content]
 *     summary: Get all pending content (Principal only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending content list
 */
router.get('/pending', isPrincipal, contentController.getPendingContent);

/**
 * @swagger
 * /api/content/{id}/review:
 *   patch:
 *     tags: [Content]
 *     summary: Approve or reject content (Principal only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content reviewed
 *       400:
 *         description: Validation error
 */
router.patch(
  '/:id/review',
  isPrincipal,
  validateBody(approveContentSchema),
  contentController.reviewContent,
);

// ── Shared routes ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     tags: [Content]
 *     summary: Get content by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content details
 */
router.get('/:id', isPrincipalOrTeacher, contentController.getContentById);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     tags: [Content]
 *     summary: Delete own content (Teacher only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted
 */
router.delete('/:id', isTeacher, contentController.deleteContent);

export default router;