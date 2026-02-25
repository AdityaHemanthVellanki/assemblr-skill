import type { Job } from 'bullmq';
import type { WorkflowClusterPayload } from '@assemblr/shared';
import { detectWorkflows } from '../services/workflow.js';

export async function handleWorkflowDetect(job: Job<WorkflowClusterPayload>) {
  const { orgId } = job.data;
  const clustersCreated = await detectWorkflows(orgId);
  return { clustersCreated };
}
