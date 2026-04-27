import { Request, Response } from 'express';
import { UserService } from './user.service';
import { asyncHandler, sendSuccess } from '../../common/asyncHandler';
import { NotFoundError } from '../../common/errors';

const userService = new UserService();

export const getAllTeachers = asyncHandler(async (_req: Request, res: Response) => {
  const teachers = await userService.getAllTeachers();
  sendSuccess(res, teachers, 'Teachers retrieved');
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  sendSuccess(res, user, 'User retrieved');
});