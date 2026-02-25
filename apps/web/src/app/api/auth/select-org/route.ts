import { prisma } from '@assemblr/shared';
import { getSession, signToken } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const session = await getSession();
  const { orgId } = await req.json();

  // For select-org, we accept either an existing session or userId from signin flow
  const userId = session?.sub;
  if (!userId) return error('Not authenticated', 401, 'UNAUTHORIZED');

  const membership = await prisma.orgUser.findFirst({
    where: { userId, orgId },
  });
  if (!membership) return error('Not a member of this org', 403, 'FORBIDDEN');

  const token = await signToken({ sub: userId, orgId, role: membership.role });
  return json({ token });
});
