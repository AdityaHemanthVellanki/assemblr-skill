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
      trigger: (latestVersion.trigger ?? {}) as any,
      nodes: (latestVersion.nodes ?? []) as any,
      edges: (latestVersion.edges ?? []) as any,
      conditions: (latestVersion.conditions ?? []) as any,
      metadata: (latestVersion.metadata ?? {}) as any,
    },
  });

  return json(newVersion, 201);
});
