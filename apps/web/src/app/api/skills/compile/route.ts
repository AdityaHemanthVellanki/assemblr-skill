import { enqueueJob } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const { clusterId } = await req.json();
  if (!clusterId) return error('clusterId required', 400);

  const jobId = await enqueueJob('SKILL_COMPILE_JOB', { orgId: s.orgId, clusterId });
  return json({ jobId, status: 'queued' }, 202);
});
