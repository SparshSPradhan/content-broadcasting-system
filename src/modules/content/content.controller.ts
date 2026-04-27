import { Request, Response } from 'express';
import { ContentService } from './content.service';
import { asyncHandler, sendSuccess, sendPaginated } from '../../common/asyncHandler';
import { ValidationError } from '../../common/errors';

const contentService = new ContentService();

export const uploadContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ValidationError('File is required');

  const result = await contentService.uploadContent(req.file, req.body, req.user!.id);
  sendSuccess(res, result, 'Content uploaded successfully', 201);
});

export const getTeacherContent = asyncHandler(async (req: Request, res: Response) => {
  const { items, total, page, limit } = await contentService.getTeacherContent(
    req.user!.id,
    req.query as any,
  );
  sendPaginated(res, items, total, page, limit, 'Content retrieved');
});

export const getAllContent = asyncHandler(async (req: Request, res: Response) => {
  const { items, total, page, limit } = await contentService.getAllContent(req.query as any);
  sendPaginated(res, items, total, page, limit, 'All content retrieved');
});

export const getPendingContent = asyncHandler(async (req: Request, res: Response) => {
  const content = await contentService.getPendingContent();
  sendSuccess(res, content, 'Pending content retrieved');
});

export const reviewContent = asyncHandler(async (req: Request, res: Response) => {
  const result = await contentService.reviewContent(
    req.params.id,
    req.user!.id,
    req.body,
  );
  sendSuccess(res, result, `Content ${req.body.action}d successfully`);
});

export const getContentById = asyncHandler(async (req: Request, res: Response) => {
  const content = await contentService.getContentById(
    req.params.id,
    req.user!.id,
    req.user!.role,
  );
  sendSuccess(res, content, 'Content retrieved');
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  await contentService.deleteContent(req.params.id, req.user!.id);
  sendSuccess(res, null, 'Content deleted');
});