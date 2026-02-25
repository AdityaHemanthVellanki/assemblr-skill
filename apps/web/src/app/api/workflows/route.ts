import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async (req) => {
  const s = await requireSession();
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  const clusters = await prisma.workflowCluster.findMany({
    where: { orgId: s.orgId },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      _count: { select: { instances: true } },
    },
  });

  const hasMore = clusters.length > limit;
  const data = hasMore ? clusters.slice(0, limit) : clusters;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return json({ data, nextCursor, hasMore });
});
