import { prisma } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const PUT = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');
  const { id } = await params;

  const skill = await prisma.skill.findFirst({ where: { id, orgId: s.orgId } });
  if (!skill) return error('Skill not found', 404, 'NOT_FOUND');

  const { edges, versionId } = await req.json();
  if (!edges || !versionId) return error('edges and versionId required', 400);

  const version = await prisma.skillVersion.findFirst({
    where: { id: versionId, skillId: id },
  });
  if (!version) return error('Version not found', 404, 'NOT_FOUND');

  const updated = await prisma.skillVersion.update({
    where: { id: versionId },
    data: { edges },
  });

  return json({ edges: updated.edges });
});
