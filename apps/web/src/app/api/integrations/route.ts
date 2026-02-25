import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const GET = handler(async () => {
  const s = await requireSession();
  const integrations = await prisma.integration.findMany({
    where: { orgId: s.orgId },
    select: {
      id: true, source: true, status: true, lastSyncAt: true,
      isActive: true, createdAt: true, errorMessage: true,
    },
  });
  return json(integrations);
});
