import { Worker, Queue } from 'bullmq';
import { QUEUE_NAME, createWorkerConnection, type JobType } from '@assemblr/shared';
import { handleBackfill } from './workers/backfill.js';
import { handleNormalize } from './workers/normalize.js';
import { handleWorkflowDetect } from './workers/workflow-detect.js';
import { handleCompile } from './workers/compile.js';
import { handleNightly } from './workers/nightly.js';

const connection = createWorkerConnection();

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const type = job.name as JobType;
    console.log(`[worker] Processing ${type} job ${job.id}`);

    switch (type) {
      case 'BACKFILL_JOB':
        return handleBackfill(job as any);
      case 'NORMALIZE_EVENTS_JOB':
        return handleNormalize(job as any);
      case 'WORKFLOW_CLUSTER_JOB':
        return handleWorkflowDetect(job as any);
      case 'SKILL_COMPILE_JOB':
        return handleCompile(job as any);
      case 'NIGHTLY_RECOMPUTE_JOB':
        return handleNightly(job as any);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

worker.on('completed', (job, result) => {
  console.log(`[worker] ${job.name} ${job.id} completed:`, JSON.stringify(result));
});

worker.on('failed', (job, error) => {
  console.error(`[worker] ${job?.name} ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('[worker] Error:', error);
});

// ─── Scheduled jobs ───

async function setupScheduler() {
  const queue = new Queue(QUEUE_NAME, { connection: createWorkerConnection() });

  await queue.upsertJobScheduler('nightly-recompute', {
    pattern: '0 2 * * *', // 2 AM daily
  }, {
    name: 'NIGHTLY_RECOMPUTE_JOB',
    data: { orgId: '__all__' },
  });

  console.log('[worker] Nightly scheduler configured');
}

setupScheduler().catch(console.error);

// ─── Graceful shutdown ───

async function shutdown() {
  console.log('[worker] Shutting down...');
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`[worker] Assemblr worker running, consuming queue: ${QUEUE_NAME}`);
