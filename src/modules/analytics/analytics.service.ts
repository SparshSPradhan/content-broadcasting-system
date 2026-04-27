import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  // Most active subjects (by total view count)
  async getMostActiveSubjects(teacherId?: string) {
    const result = await prisma.contentAnalytics.groupBy({
      by: ['subject'],
      where: teacherId ? { teacherId } : undefined,
      _sum: { viewCount: true },
      _count: { contentId: true },
      orderBy: { _sum: { viewCount: 'desc' } },
      take: 10,
    });

    return result.map((r) => ({
      subject: r.subject,
      totalViews: r._sum.viewCount ?? 0,
      contentCount: r._count.contentId,
    }));
  }

  // Content usage tracking
  async getContentUsage(teacherId?: string, subject?: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const analytics = await prisma.contentAnalytics.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(subject && { subject }),
        date: { gte: since },
      },
      include: {
        content: { select: { id: true, title: true, subject: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 50,
    });

    return analytics.map((a) => ({
      contentId: a.contentId,
      title: a.content.title,
      subject: a.subject,
      viewCount: a.viewCount,
      lastViewed: a.lastViewed,
      date: a.date,
    }));
  }

  // Teacher-specific analytics summary
  async getTeacherAnalyticsSummary(teacherId: string) {
    const [totalViews, subjectBreakdown, topContent] = await Promise.all([
      prisma.contentAnalytics.aggregate({
        where: { teacherId },
        _sum: { viewCount: true },
      }),
      this.getMostActiveSubjects(teacherId),
      prisma.contentAnalytics.findMany({
        where: { teacherId },
        include: { content: { select: { title: true } } },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalViews: totalViews._sum.viewCount ?? 0,
      subjectBreakdown,
      topContent: topContent.map((a) => ({
        contentId: a.contentId,
        title: a.content.title,
        subject: a.subject,
        viewCount: a.viewCount,
      })),
    };
  }

  // Global analytics (Principal)
  async getGlobalAnalytics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalViews, mostActiveSubjects, dailyTrend] = await Promise.all([
      prisma.contentAnalytics.aggregate({
        where: { date: { gte: since } },
        _sum: { viewCount: true },
      }),
      this.getMostActiveSubjects(),
      prisma.contentAnalytics.groupBy({
        by: ['date'],
        where: { date: { gte: since } },
        _sum: { viewCount: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      totalViews: totalViews._sum.viewCount ?? 0,
      mostActiveSubjects,
      dailyTrend: dailyTrend.map((d) => ({
        date: d.date,
        views: d._sum.viewCount ?? 0,
      })),
    };
  }
}