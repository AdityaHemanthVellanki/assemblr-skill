import { prisma } from '@assemblr/shared';
import type { SkillGraphExport } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const GET = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  const { id } = await params;
  const url = new URL(req.url);
  const versionNum = url.searchParams.get('version');

  const skill = await prisma.skill.findFirst({
    where: { id, orgId: s.orgId },
  });

  if (!skill) return error('Skill not found', 404, 'NOT_FOUND');

  const version = versionNum
    ? await prisma.skillVersion.findFirst({
        where: { skillId: id, version: Number(versionNum) },
      })
    : await prisma.skillVersion.findFirst({
        where: { skillId: id },
        orderBy: { version: 'desc' },
      });

  if (!version) return error('No version found', 404, 'NOT_FOUND');

  const exportData = {
    skillId: skill.id,
    name: skill.name,
    version: version.version,
    trigger: version.trigger,
    nodes: version.nodes,
    edges: version.edges,
    conditions: version.conditions,
    metadata: version.metadata,
    exportedAt: new Date().toISOString(),
  };

  return json(exportData);
});
