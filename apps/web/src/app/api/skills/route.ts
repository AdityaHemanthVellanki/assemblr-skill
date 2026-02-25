import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async (req) => {
  const s = await requireSession();
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const status = url.searchParams.get('status') || undefined;

  const skills = await prisma.skill.findMany({
    where: {
      orgId: s.orgId,
      ...(status && { status }),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { id: true, version: true, createdAt: true },
      },
      _count: { select: { versions: true } },
    },
  });

  const hasMore = skills.length > limit;
  const data = hasMore ? skills.slice(0, limit) : skills;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return json({ data, nextCursor, hasMore });
});
