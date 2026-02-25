import { prisma, type NormalizePayload } from '@assemblr/shared';
import type { Job } from 'bullmq';
import { normalizeStripeEvent } from '../services/stripe.js';

/**
 * Normalize raw events that were stored via webhook (Stripe) or other non-adapter paths.
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

    let event = null;

    if (raw.source === 'STRIPE') {
      event = normalizeStripeEvent(orgId, rawId, raw.rawPayload as Record<string, unknown>);
    }

    if (event) {
      await prisma.universalEvent.create({
        data: {
          orgId: event.orgId,
          source: event.source as any,
          eventType: event.eventType,
          actorId: event.actorId,
          entityType: event.entityType,
          entityId: event.entityId,
          timestamp: event.timestamp,
          metadata: event.metadata as any,
          rawEventId: rawId,
        },
      });
      normalized++;
    }
  }

  return { normalized };
}
