import { Router } from 'express';
import { asyncHandler, sendSuccess } from '../../common/asyncHandler';
import { SchedulingService } from './scheduling.service';
import { authenticate } from '../../middlewares/auth.middleware';
import { isTeacher } from '../../middlewares/rbac.middleware';

const router = Router();
const schedulingService = new SchedulingService();

router.use(authenticate);

/**
 * @swagger
 * /api/scheduling/slots:
 *   get:
 *     tags: [Scheduling]
 *     summary: Get teacher's content slots and rotation order
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slot info with rotation schedules
 */
router.get(
  '/slots',
  isTeacher,
  asyncHandler(async (req, res) => {
    const slots = await schedulingService.getSlotInfo(req.user!.id);
    sendSuccess(res, slots, 'Slot info retrieved');
  }),
);

export default router;