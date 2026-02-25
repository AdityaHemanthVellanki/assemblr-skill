import type { Job } from 'bullmq';
import type { SkillCompilePayload } from '@assemblr/shared';
import { compileSkill } from '../services/compiler.js';

export async function handleCompile(job: Job<SkillCompilePayload>) {
  const { orgId, clusterId, name } = job.data;
  return compileSkill(orgId, clusterId, name);
}
