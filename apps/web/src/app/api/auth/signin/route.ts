import { prisma } from '@assemblr/shared';
import bcrypt from 'bcryptjs';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const { email, password } = await req.json();
  if (!email || !password) return error('Missing credentials', 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return error('Invalid credentials', 401, 'UNAUTHORIZED');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return error('Invalid credentials', 401, 'UNAUTHORIZED');

  const memberships = await prisma.orgUser.findMany({
    where: { userId: user.id },
    include: { org: { select: { name: true, slug: true } } },
  });

  return json({
    user: { id: user.id, email: user.email, name: user.name },
    memberships: memberships.map((m) => ({
      orgId: m.orgId, role: m.role, orgName: m.org.name, orgSlug: m.org.slug,
    })),
  });
});
