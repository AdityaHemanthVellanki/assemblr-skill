import { prisma, enqueueJob } from '@assemblr/shared';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Find all orgs with Stripe integration to match
  // In production, match via Stripe customer ID on the event
  const stripeIntegrations = await prisma.integration.findMany({
    where: { source: 'STRIPE', status: 'CONNECTED', isActive: true },
  });

  for (const integration of stripeIntegrations) {
    await prisma.rawEvent.create({
      data: {
        orgId: integration.orgId,
        source: 'STRIPE',
        externalId: event.id,
        eventType: event.type,
        payload: event.data as any,
        receivedAt: new Date(),
      },
    });

    await enqueueJob('NORMALIZE_EVENTS_JOB', {
      orgId: integration.orgId,
      source: 'STRIPE',
      eventIds: [event.id],
    });
  }

  return NextResponse.json({ received: true });
}
