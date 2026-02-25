import { prisma, encrypt } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, created, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const { source, connectionId, redirectUrl } = await req.json();
  if (!source) return error('source required', 400);

  // In production, you'd redirect to Composio OAuth and get connectionId back.
  // For now, store the provided connectionId directly.
  const encryptedCreds = connectionId ? encrypt(JSON.stringify({ connectionId })) : null;

  const integration = await prisma.integration.upsert({
    where: { orgId_source: { orgId: s.orgId, source } },
    create: {
      orgId: s.orgId, source, status: 'CONNECTED',
      composioConnectionId: connectionId || null,
      encryptedCredentials: encryptedCreds,
    },
    update: {
      status: 'CONNECTED',
      composioConnectionId: connectionId || null,
      encryptedCredentials: encryptedCreds,
      isActive: true,
    },
  });

  return created({ id: integration.id, source, status: integration.status });
});
