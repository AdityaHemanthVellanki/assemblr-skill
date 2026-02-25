import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async (req) => {
  const s = await requireSession();
  const url = new URL(req.url);

  const source = url.searchParams.get('source') || undefined;
  const eventType = url.searchParams.get('eventType') || undefined;
  const actorId = url.searchParams.get('actorId') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  const events = await prisma.universalEvent.findMany({
    where: {
      orgId: s.orgId,
      ...(source && { source }),
      ...(eventType && { eventType }),
      ...(actorId && { actorId }),
    },
    orderBy: { timestamp: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: { actor: { select: { id: true, displayName: true, primaryEmail: true } } },
  });

  const hasMore = events.length > limit;
  const data = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return json({ data, nextCursor, hasMore });
});
