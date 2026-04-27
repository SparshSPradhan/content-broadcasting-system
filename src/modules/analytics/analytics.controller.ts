import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { asyncHandler, sendSuccess } from '../../common/asyncHandler';

const analyticsService = new AnalyticsService();

export const getGlobalAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt((req.query.days as string) ?? '30', 10);
  const data = await analyticsService.getGlobalAnalytics(days);
  sendSuccess(res, data, 'Global analytics retrieved');
});

export const getMostActiveSubjects = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getMostActiveSubjects();
  sendSuccess(res, data, 'Most active subjects retrieved');
});

export const getMyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getTeacherAnalyticsSummary(req.user!.id);
  sendSuccess(res, data, 'Teacher analytics retrieved');
});

export const getContentUsage = asyncHandler(async (req: Request, res: Response) => {
  const { subject, days } = req.query as { subject?: string; days?: string };
  const teacherId = req.user!.role === 'teacher' ? req.user!.id : (req.query.teacherId as string | undefined);
  const data = await analyticsService.getContentUsage(teacherId, subject, days ? parseInt(days, 10) : 30);
  sendSuccess(res, data, 'Content usage retrieved');
});