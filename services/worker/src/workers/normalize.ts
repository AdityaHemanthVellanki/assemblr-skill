import { prisma, type NormalizePayload } from '@assemblr/shared';
import type { Job } from 'bullmq';

/**
 * Normalize raw events that were stored via webhook or other non-adapter paths.
 * The backfill worker handles adapter-based normalization inline.
 */
export async function handleNormalize(job: Job<NormalizePayload>) {
  const { orgId, rawEventIds } = job.data;
  let normalized = 0;

  for (const rawId of rawEventIds) {
    const raw = await prisma.rawEvent.findUnique({ where: { id: rawId } });
    if (!raw || raw.orgId !== orgId) continue;

    // Check if already normalized
    const existing = await prisma.universalEvent.findUnique({ where: { rawEventId: rawId } });
    if (existing) continue;

    // Future: add source-specific normalization logic here for non-adapter sources.
    // Adapter-based sources (Slack, GitHub, HubSpot, Jira, Notion, Google) normalize
    // inline during backfill, so this worker handles edge cases.
  }

  return { normalized };
}
