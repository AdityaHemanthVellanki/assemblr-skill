import { prisma } from '@assemblr/shared';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { handler, created, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const { email, password, name, orgName, orgSlug } = await req.json();

  if (!email || !password || !name || !orgName || !orgSlug) {
    return error('Missing required fields', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error('Email already registered', 409, 'CONFLICT');

  const existingOrg = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (existingOrg) return error('Org slug already taken', 409, 'CONFLICT');

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash, name } });
    const org = await tx.organization.create({ data: { name: orgName, slug: orgSlug } });
    await tx.orgUser.create({ data: { orgId: org.id, userId: user.id, role: 'OWNER' } });
    return { userId: user.id, orgId: org.id };
  });

  const token = await signToken({ sub: result.userId, orgId: result.orgId, role: 'OWNER' });
  return created({ token, userId: result.userId, orgId: result.orgId });
});
