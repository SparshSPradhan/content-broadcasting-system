import { Request, Response } from 'express';
import { BroadcastingService } from './broadcasting.service';
import { asyncHandler } from '../../common/asyncHandler';

const broadcastingService = new BroadcastingService();

export const getLiveContent = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const { subject } = req.query as { subject?: string };

  const result = await broadcastingService.getLiveContent(teacherId, subject);

  // Always return 200 for public API (edge case: no content = 200 with message)
  return res.status(200).json({
    success: true,
    ...result,
  });
});