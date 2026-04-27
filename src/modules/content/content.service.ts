import path from 'path';
import fs from 'fs';
import { ContentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { uploadToS3 } from '../../lib/s3';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { cacheDel } from '../../lib/redis';
import type { UploadContentInput, ApproveContentInput, ContentQueryInput } from './content.schema';

export class ContentService {
  // ── Teacher: Upload content ─────────────────────────────────────────────
  async uploadContent(
    file: Express.Multer.File,
    data: UploadContentInput,
    teacherId: string,
  ) {
    let fileUrl: string | undefined;
    let filePath = file.path;

    // If S3 is enabled, upload there
    if (env.USE_S3) {
      const key = `content/${path.basename(file.path)}`;
      fileUrl = await uploadToS3(file.path, key, file.mimetype);
      // Keep local file as fallback reference; optionally delete it
    }

    const content = await prisma.$transaction(async (tx) => {
      const created = await tx.content.create({
        data: {
          title: data.title,
          subject: data.subject,
          description: data.description,
          filePath: file.path,
          fileUrl: fileUrl ?? null,
          fileType: file.mimetype,
          fileSize: file.size,
          status: ContentStatus.pending,
          startTime: data.startTime ? new Date(data.startTime) : null,
          endTime: data.endTime ? new Date(data.endTime) : null,
          rotationDuration: data.rotationDuration ?? null,
          uploadedById: teacherId,
        },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      });

      // Create/find content slot for this teacher+subject
      const slot = await tx.contentSlot.upsert({
        where: { subject_teacherId: { subject: data.subject, teacherId } },
        create: { subject: data.subject, teacherId },
        update: {},
      });

      // Add to rotation schedule if duration provided
      if (data.rotationDuration) {
        const maxOrder = await tx.contentSchedule.aggregate({
          where: { slotId: slot.id },
          _max: { rotationOrder: true },
        });
        const nextOrder = (maxOrder._max.rotationOrder ?? 0) + 1;

        await tx.contentSchedule.create({
          data: {
            contentId: created.id,
            slotId: slot.id,
            rotationOrder: nextOrder,
            duration: data.rotationDuration,
          },
        });
      }

      return created;
    });

    // Invalidate cache for this teacher's live content
    await cacheDel(`live:${teacherId}:*`);

    return content;
  }

  // ── Teacher: Get own content ────────────────────────────────────────────
  async getTeacherContent(teacherId: string, query: ContentQueryInput) {
    const { page, limit, subject, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {
      uploadedById: teacherId,
      ...(subject && { subject }),
      ...(status && { status }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          schedules: { include: { slot: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── Principal: Get all content ──────────────────────────────────────────
  async getAllContent(query: ContentQueryInput) {
    const { page, limit, subject, status, teacherId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {
      ...(subject && { subject }),
      ...(status && { status }),
      ...(teacherId && { uploadedById: teacherId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── Principal: Get pending content ─────────────────────────────────────
  async getPendingContent() {
    return prisma.content.findMany({
      where: { status: ContentStatus.pending },
      orderBy: { createdAt: 'asc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ── Principal: Approve/Reject content ──────────────────────────────────
  async reviewContent(contentId: string, principalId: string, data: ApproveContentInput) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundError('Content not found');

    if (content.status !== ContentStatus.pending) {
      throw new ValidationError(`Content is already ${content.status}`);
    }

    const updated = await prisma.content.update({
      where: { id: contentId },
      data:
        data.action === 'approve'
          ? {
              status: ContentStatus.approved,
              approvedById: principalId,
              approvedAt: new Date(),
              rejectionReason: null,
            }
          : {
              status: ContentStatus.rejected,
              rejectionReason: data.rejectionReason,
            },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    // Invalidate live cache for the teacher
    await cacheDel(`live:${content.uploadedById}:*`);

    return updated;
  }

  // ── Get single content ──────────────────────────────────────────────────
  async getContentById(contentId: string, requesterId: string, requesterRole: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        schedules: { include: { slot: true } },
      },
    });

    if (!content) throw new NotFoundError('Content not found');

    // Teachers can only see their own content
    if (requesterRole === 'teacher' && content.uploadedById !== requesterId) {
      throw new ForbiddenError('You can only view your own content');
    }

    return content;
  }

  // ── Teacher: Delete their own content ──────────────────────────────────
  async deleteContent(contentId: string, teacherId: string) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundError('Content not found');
    if (content.uploadedById !== teacherId) throw new ForbiddenError('Not your content');

    // Delete file from disk
    if (content.filePath && fs.existsSync(content.filePath)) {
      fs.unlinkSync(content.filePath);
    }

    await prisma.content.delete({ where: { id: contentId } });
    await cacheDel(`live:${teacherId}:*`);
  }
}