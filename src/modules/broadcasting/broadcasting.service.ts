import { prisma } from '../../lib/prisma';
import { SchedulingService } from '../scheduling/scheduling.service';
import { cacheGet, cacheSet } from '../../lib/redis';
import { env } from '../../config/env';
import { NotFoundError } from '../../common/errors';

const schedulingService = new SchedulingService();

export class BroadcastingService {
  async getLiveContent(teacherIdentifier: string, subject?: string) {
    // Resolve teacher by ID or by sequential ID like "teacher-1"
    let teacherId: string;

    if (teacherIdentifier.match(/^[0-9a-f-]{36}$/i)) {
      // UUID format
      teacherId = teacherIdentifier;
    } else {
      // Handle "teacher-1", "teacher-2" style identifiers
      // Get teachers ordered by createdAt and pick by 1-based index
      const match = teacherIdentifier.match(/^teacher-(\d+)$/i);
      if (match) {
        const index = parseInt(match[1], 10) - 1;
        const teachers = await prisma.user.findMany({
          where: { role: 'teacher' },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
          skip: index,
          take: 1,
        });
        if (!teachers.length) {
          // Return "no content" instead of error for edge case handling
          return { available: false, message: 'No content available', data: null };
        }
        teacherId = teachers[0].id;
      } else {
        return { available: false, message: 'No content available', data: null };
      }
    }

    // Verify teacher exists
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId, role: 'teacher' },
      select: { id: true, name: true },
    });

    if (!teacher) {
      return { available: false, message: 'No content available', data: null };
    }

    // Build cache key
    const cacheKey = `live:${teacherId}:${subject ?? 'all'}`;

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get live content via scheduling logic
    const activeContent = await schedulingService.getLiveContent(teacherId, subject);

    const result = activeContent && activeContent.length > 0
      ? {
          available: true,
          message: 'Live content retrieved',
          teacher: { id: teacher.id, name: teacher.name },
          data: activeContent,
        }
      : {
          available: false,
          message: 'No content available',
          teacher: { id: teacher.id, name: teacher.name },
          data: null,
        };

    // Cache for TTL seconds
    await cacheSet(cacheKey, JSON.stringify(result), env.CACHE_TTL);

    return result;
  }
}