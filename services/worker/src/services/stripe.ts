import { STRIPE_EVENTS } from '../adapters/interface.js';
import type { UniversalEventInput } from '@assemblr/shared';

/**
 * Normalize a Stripe webhook event into a UniversalEvent.
 * Called by the normalize worker after the API route stores the raw event.
 */
export function normalizeStripeEvent(
  orgId: string,
  rawEventId: string,
  stripeEvent: Record<string, unknown>,
): UniversalEventInput | null {
  const eventType = stripeEvent.type as string;
  const mapping = STRIPE_EVENTS[eventType];
  if (!mapping) return null;

  const obj = (stripeEvent.data as Record<string, unknown>)?.object as Record<string, unknown> || {};
  const customerId = (obj.customer as string) || (obj.id as string);
  const entityId = (obj.id as string) || (stripeEvent.id as string);

  return {
    orgId,
    source: 'STRIPE',
    eventType: mapping.eventType,
    actorId: customerId || null,
    entityType: mapping.entityType,
    entityId,
    timestamp: new Date((stripeEvent.created as number) * 1000),
    metadata: {
      stripeEventType: eventType,
      livemode: stripeEvent.livemode,
      ...(obj.status ? { status: obj.status } : {}),
      ...(obj.amount ? { amount: obj.amount } : {}),
      ...(obj.currency ? { currency: obj.currency } : {}),
    },
    rawEventId,
  };
}
