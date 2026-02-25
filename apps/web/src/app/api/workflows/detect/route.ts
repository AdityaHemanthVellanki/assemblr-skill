import { enqueueJob } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json } from '@/lib/api-utils';

export const POST = handler(async () => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const jobId = await enqueueJob('WORKFLOW_CLUSTER_JOB', { orgId: s.orgId });
  return json({ jobId, status: 'queued' }, 202);
});
