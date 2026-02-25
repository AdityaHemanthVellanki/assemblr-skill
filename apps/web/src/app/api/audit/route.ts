import { prisma } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const action = url.searchParams.get('action') || undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      orgId: s.orgId,
      ...(action && { action }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = logs.length > limit;
  const data = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return json({ data, nextCursor, hasMore });
});
