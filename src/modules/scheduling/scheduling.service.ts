import { ContentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface ActiveContent {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  filePath: string;
  fileUrl: string | null;
  fileType: string;
  fileSize: number;
  startTime: Date | null;
  endTime: Date | null;
  rotationDuration: number | null;
  uploadedBy: { id: string; name: string; email: string };
}

/**
 * Core Scheduling/Rotation Logic:
 *
 * 1. Fetch all approved content for a teacher (+ optional subject filter)
 * 2. Filter only content with valid time windows containing "now"
 * 3. Group content by subject; each subject has its own independent rotation
 * 4. For each subject, determine active content using:
 *    - Compute the "epoch" - when does this rotation cycle start?
 *      We use the earliest startTime of approved content in that subject as the epoch.
 *    - elapsed = (now - epoch) in milliseconds
 *    - Rotate through content items based on their duration
 *    - Find which item is currently "on air" using modular arithmetic
 * 5. Return the currently active item(s)
 */
export class SchedulingService {
  async getLiveContent(
    teacherId: string,
    subject?: string,
  ): Promise<ActiveContent[] | null> {
    const now = new Date();

    // Fetch all approved content for this teacher that is within time window
    const approvedContent = await prisma.content.findMany({
      where: {
        uploadedById: teacherId,
        status: ContentStatus.approved,
        ...(subject && { subject }),
        // Must have both startTime and endTime set
        startTime: { not: null, lte: now },
        endTime: { not: null, gte: now },
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        schedules: {
          include: { slot: true },
          orderBy: { rotationOrder: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Edge case: no approved+live content
    if (approvedContent.length === 0) {
      return null;
    }

    // Group by subject for independent rotation
    const bySubject = new Map<string, typeof approvedContent>();
    for (const content of approvedContent) {
      const list = bySubject.get(content.subject) ?? [];
      list.push(content);
      bySubject.set(content.subject, list);
    }

    const activeItems: ActiveContent[] = [];

    for (const [subjectKey, items] of bySubject.entries()) {
      if (subject && subjectKey !== subject) continue;

      const active = this.determineActiveContent(items, now);
      if (active) {
        const { schedules: _s, ...rest } = active;
        activeItems.push(rest as ActiveContent);

        // Track analytics (fire and forget)
        this.trackView(active.id, subjectKey, teacherId).catch(() => {});
      }
    }

    return activeItems.length > 0 ? activeItems : null;
  }

  /**
   * Determines the currently active content item for a subject using rotation logic.
   *
   * Algorithm:
   * - Use the earliest startTime among the content items as the rotation "epoch"
   * - Compute elapsed time since epoch
   * - Assign each content a duration (from schedule or default 5 min)
   * - Total cycle = sum of all durations
   * - Position in cycle = elapsed % total cycle
   * - Walk through items to find which one is active at the current position
   */
  private determineActiveContent<T extends {
    id: string;
    startTime: Date | null;
    rotationDuration: number | null;
    schedules: { rotationOrder: number; duration: number }[];
  }>(items: T[], now: Date): T | null {
    if (items.length === 0) return null;
    if (items.length === 1) return items[0];

    // Sort by schedule rotation order if available, else by startTime
    const sorted = [...items].sort((a, b) => {
      const aOrder = a.schedules[0]?.rotationOrder ?? 999;
      const bOrder = b.schedules[0]?.rotationOrder ?? 999;
      return aOrder - bOrder;
    });

    // Epoch: earliest startTime among items
    const epoch = sorted.reduce((earliest, item) => {
      if (!item.startTime) return earliest;
      return item.startTime < earliest ? item.startTime : earliest;
    }, sorted[0].startTime ?? now);

    const elapsedMs = now.getTime() - epoch.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    // Build rotation list with durations
    const rotationList = sorted.map((item) => ({
      item,
      duration: item.schedules[0]?.duration ?? item.rotationDuration ?? 5,
    }));

    const totalCycleMinutes = rotationList.reduce((sum, r) => sum + r.duration, 0);
    if (totalCycleMinutes === 0) return sorted[0];

    // Position in current cycle
    const positionInCycle = elapsedMinutes % totalCycleMinutes;

    // Walk through rotation to find active item
    let accumulated = 0;
    for (const rotation of rotationList) {
      accumulated += rotation.duration;
      if (positionInCycle < accumulated) {
        return rotation.item;
      }
    }

    // Fallback to first item
    return sorted[0];
  }

  private async trackView(contentId: string, subject: string, teacherId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.contentAnalytics.upsert({
      where: { contentId_date: { contentId, date: today } },
      create: {
        contentId,
        subject,
        teacherId,
        viewCount: 1,
        lastViewed: new Date(),
        date: today,
      },
      update: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
      },
    });
  }

  async getSlotInfo(teacherId: string) {
    return prisma.contentSlot.findMany({
      where: { teacherId },
      include: {
        schedules: {
          include: { content: { select: { id: true, title: true, status: true } } },
          orderBy: { rotationOrder: 'asc' },
        },
      },
    });
  }
}