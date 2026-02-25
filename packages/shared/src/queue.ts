import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const QUEUE_NAME = 'assemblr-jobs';

export type JobType =
  | 'BACKFILL_JOB'
  | 'NORMALIZE_EVENTS_JOB'
  | 'WORKFLOW_CLUSTER_JOB'
  | 'SKILL_COMPILE_JOB'
  | 'NIGHTLY_RECOMPUTE_JOB';

export interface BackfillPayload {
  orgId: string;
  source: string;
}

export interface NormalizePayload {
  orgId: string;
  rawEventIds: string[];
}

export interface WorkflowClusterPayload {
  orgId: string;
}

export interface SkillCompilePayload {
  orgId: string;
  clusterId: string;
  name?: string;
}

export interface NightlyPayload {
  orgId: string;
}

export type JobPayload =
  | BackfillPayload
  | NormalizePayload
  | WorkflowClusterPayload
  | SkillCompilePayload
  | NightlyPayload;

function createRedisConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}

/**
 * For serverless (Vercel): create queue, add job, close.
 * Connection is short-lived to avoid dangling sockets.
 */
export async function enqueueJob(
  jobType: JobType,
  payload: JobPayload,
  opts?: { delay?: number; priority?: number },
): Promise<string> {
  const connection = createRedisConnection();
  const queue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });

  const job = await queue.add(jobType, payload, {
    delay: opts?.delay,
    priority: opts?.priority,
  });

  await queue.close();
  await connection.quit();

  return job.id!;
}

/**
 * For long-running workers (Railway): persistent connection.
 */
export function createWorkerConnection(): IORedis {
  return createRedisConnection();
}
