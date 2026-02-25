import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const GET = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  const { id } = await params;

  const cluster = await prisma.workflowCluster.findFirst({
    where: { id, orgId: s.orgId },
    include: {
      instances: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!cluster) return error('Workflow cluster not found', 404, 'NOT_FOUND');
  return json(cluster);
});
