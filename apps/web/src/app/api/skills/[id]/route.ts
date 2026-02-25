import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const GET = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  const { id } = await params;

  const skill = await prisma.skill.findFirst({
    where: { id, orgId: s.orgId },
    include: {
      versions: { orderBy: { version: 'desc' } },
      cluster: { select: { id: true, anchorEventType: true, eventSequence: true, confidence: true } },
    },
  });

  if (!skill) return error('Skill not found', 404, 'NOT_FOUND');
  return json(skill);
});

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  const { id } = await params;

  const existing = await prisma.skill.findFirst({ where: { id, orgId: s.orgId } });
  if (!existing) return error('Skill not found', 404, 'NOT_FOUND');

  const { name, description, status } = await req.json();
  const skill = await prisma.skill.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
    },
  });

  return json(skill);
});

export const DELETE = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireSession();
  const { id } = await params;

  const existing = await prisma.skill.findFirst({ where: { id, orgId: s.orgId } });
  if (!existing) return error('Skill not found', 404, 'NOT_FOUND');

  await prisma.skill.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
