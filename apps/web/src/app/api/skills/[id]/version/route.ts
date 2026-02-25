import { prisma } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');
  const { id } = await params;

  const skill = await prisma.skill.findFirst({ where: { id, orgId: s.orgId } });
  if (!skill) return error('Skill not found', 404, 'NOT_FOUND');

  const latestVersion = await prisma.skillVersion.findFirst({
    where: { skillId: id },
    orderBy: { version: 'desc' },
  });

  if (!latestVersion) return error('No existing version to copy', 404, 'NOT_FOUND');

  const newVersion = await prisma.skillVersion.create({
    data: {
      skillId: id,
      version: latestVersion.version + 1,
      trigger: latestVersion.trigger || undefined,
      nodes: latestVersion.nodes || undefined,
      edges: latestVersion.edges || undefined,
      conditions: latestVersion.conditions || undefined,
      metadata: latestVersion.metadata || undefined,
    },
  });

  return json(newVersion, 201);
});
