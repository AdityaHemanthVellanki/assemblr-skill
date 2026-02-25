import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async () => {
  const s = await requireSession();

  const [total, bySource, byType, recentCount] = await Promise.all([
    prisma.universalEvent.count({ where: { orgId: s.orgId } }),
    prisma.universalEvent.groupBy({
      by: ['source'],
      where: { orgId: s.orgId },
      _count: true,
    }),
    prisma.universalEvent.groupBy({
      by: ['eventType'],
      where: { orgId: s.orgId },
      _count: true,
      orderBy: { _count: { eventType: 'desc' } },
      take: 10,
    }),
    prisma.universalEvent.count({
      where: {
        orgId: s.orgId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return json({
    total,
    last24h: recentCount,
    bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
    topEventTypes: byType.map((t) => ({ eventType: t.eventType, count: t._count })),
  });
});
