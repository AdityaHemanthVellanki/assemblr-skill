import type { Job } from 'bullmq';
import type { NightlyPayload } from '@assemblr/shared';
import { detectWorkflows } from '../services/workflow.js';

export async function handleNightly(job: Job<NightlyPayload>) {
  const { orgId } = job.data;
  const clustersCreated = await detectWorkflows(orgId);
  return { clustersCreated, recomputedAt: new Date().toISOString() };
}
