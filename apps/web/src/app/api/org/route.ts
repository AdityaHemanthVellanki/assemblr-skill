import { prisma } from '@assemblr/shared';
import { requireSession } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const GET = handler(async () => {
  const s = await requireSession();
  const org = await prisma.organization.findUnique({ where: { id: s.orgId } });
  if (!org) return error('Org not found', 404, 'NOT_FOUND');
  return json(org);
});

export const PATCH = handler(async (req) => {
  const s = await requireSession();
  if (s.role !== 'OWNER' && s.role !== 'ADMIN') return error('Forbidden', 403, 'FORBIDDEN');
  const { name } = await req.json();
  const org = await prisma.organization.update({ where: { id: s.orgId }, data: { name } });
  return json(org);
});
