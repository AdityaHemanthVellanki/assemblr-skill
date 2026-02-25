import { prisma } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, created, error } from '@/lib/api-utils';

export const GET = handler(async () => {
  const s = await requireSession();
  const members = await prisma.orgUser.findMany({
    where: { orgId: s.orgId },
    include: { user: { select: { email: true, name: true } } },
  });
  return json(members.map((m) => ({
    id: m.id, userId: m.userId, role: m.role,
    email: m.user.email, name: m.user.name, createdAt: m.createdAt,
  })));
});

export const POST = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const { email, role } = await req.json();
  if (role === 'OWNER') return error('Cannot assign owner via invite', 403, 'FORBIDDEN');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return error('User not found', 404, 'NOT_FOUND');

  const existing = await prisma.orgUser.findFirst({ where: { orgId: s.orgId, userId: user.id } });
  if (existing) return error('Already a member', 409, 'CONFLICT');

  const member = await prisma.orgUser.create({
    data: { orgId: s.orgId, userId: user.id, role: role || 'MEMBER' },
  });
  return created(member);
});
