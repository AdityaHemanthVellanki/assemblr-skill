import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async (req) => {
  const s = await requireSession();
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  const actors = await prisma.orgActor.findMany({
    where: {
      orgId: s.orgId,
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' as const } },
          { primaryEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = actors.length > limit;
  const data = hasMore ? actors.slice(0, limit) : actors;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return json({ data, nextCursor, hasMore });
});
