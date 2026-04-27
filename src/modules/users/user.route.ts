import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { isPrincipal, isPrincipalOrTeacher } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users/teachers:
 *   get:
 *     tags: [Users]
 *     summary: Get all teachers (Principal only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/teachers', isPrincipal, userController.getAllTeachers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', isPrincipalOrTeacher, userController.getUserById);

export default router;