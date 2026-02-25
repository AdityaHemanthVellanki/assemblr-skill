import { enqueueJob } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const { source } = await req.json();
  if (!source) return error('source required', 400);

  const jobId = await enqueueJob('BACKFILL_JOB', { orgId: s.orgId, source });
  return json({ jobId, status: 'queued' }, 202);
});
