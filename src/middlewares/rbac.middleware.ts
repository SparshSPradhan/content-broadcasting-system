import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../common/errors';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`),
      );
    }

    next();
  };

export const isPrincipal = authorize(Role.principal);
export const isTeacher = authorize(Role.teacher);
export const isPrincipalOrTeacher = authorize(Role.principal, Role.teacher);