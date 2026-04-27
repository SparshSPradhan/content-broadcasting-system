import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const uploadContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  subject: z.string().min(1, 'Subject is required').toLowerCase(),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime({ message: 'Invalid start time (ISO 8601 required)' }).optional(),
  endTime: z.string().datetime({ message: 'Invalid end time (ISO 8601 required)' }).optional(),
  rotationDuration: z.string().transform(Number).pipe(z.number().min(1).max(1440)).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] },
);

export const contentQuerySchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('10').transform(Number).pipe(z.number().min(1).max(100)),
  subject: z.string().toLowerCase().optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  teacherId: z.string().uuid().optional(),
});

export const approveContentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(1).max(500).optional(),
}).refine(
  (data) => data.action !== 'reject' || !!data.rejectionReason,
  { message: 'Rejection reason is required when rejecting', path: ['rejectionReason'] },
);

export const broadcastQuerySchema = z.object({
  subject: z.string().toLowerCase().optional(),
});

export type UploadContentInput = z.infer<typeof uploadContentSchema>;
export type ContentQueryInput = z.infer<typeof contentQuerySchema>;
export type ApproveContentInput = z.infer<typeof approveContentSchema>;