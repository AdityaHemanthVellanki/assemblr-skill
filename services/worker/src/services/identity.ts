import { prisma, type Source } from '@assemblr/shared';

interface ActorHints {
  email?: string;
  displayName?: string;
  slackId?: string;
  githubId?: string;
  hubspotId?: string;
  jiraId?: string;
  notionId?: string;
  googleId?: string;
  stripeCustomerId?: string;
}

const SOURCE_FIELD: Record<Source, keyof ActorHints | null> = {
  SLACK: 'slackId', GITHUB: 'githubId', HUBSPOT: 'hubspotId',
  JIRA: 'jiraId', NOTION: 'notionId', GOOGLE: 'googleId', STRIPE: 'stripeCustomerId',
};

export async function resolveActor(orgId: string, source: Source, hints: ActorHints): Promise<string | null> {
  const field = SOURCE_FIELD[source];
  const sourceId = field ? hints[field] : undefined;

  // Try source-specific ID match
  if (field && sourceId) {
    const match = await prisma.orgActor.findFirst({
      where: { orgId, [field]: sourceId },
    });
    if (match) {
      await updateActor(match.id, source, hints);
      return match.id;
    }
  }

  // Try email match
  if (hints.email) {
    const match = await prisma.orgActor.findFirst({
      where: { orgId, primaryEmail: hints.email },
    });
    if (match) {
      await updateActor(match.id, source, hints);
      return match.id;
    }
  }

  // Create new actor
  const actor = await prisma.orgActor.create({
    data: {
      orgId,
      primaryEmail: hints.email,
      displayName: hints.displayName,
      ...(field && sourceId ? { [field]: sourceId } : {}),
    },
  });

  return actor.id;
}

async function updateActor(id: string, source: Source, hints: ActorHints) {
  const field = SOURCE_FIELD[source];
  const sourceId = field ? hints[field] : undefined;

  const updates: Record<string, unknown> = {};
  if (hints.email) updates.primaryEmail = hints.email;
  if (hints.displayName) updates.displayName = hints.displayName;
  if (field && sourceId) updates[field] = sourceId;

  if (Object.keys(updates).length > 0) {
    await prisma.orgActor.update({ where: { id }, data: updates });
  }
}

export async function mergeActors(orgId: string, primaryId: string, secondaryId: string) {
  const [primary, secondary] = await Promise.all([
    prisma.orgActor.findUniqueOrThrow({ where: { id: primaryId } }),
    prisma.orgActor.findUniqueOrThrow({ where: { id: secondaryId } }),
  ]);

  if (primary.orgId !== orgId || secondary.orgId !== orgId) {
    throw new Error('Actors do not belong to this org');
  }

  await prisma.$transaction([
    prisma.orgActor.update({
      where: { id: primaryId },
      data: {
        primaryEmail: primary.primaryEmail || secondary.primaryEmail,
        displayName: primary.displayName || secondary.displayName,
        slackId: primary.slackId || secondary.slackId,
        githubId: primary.githubId || secondary.githubId,
        hubspotId: primary.hubspotId || secondary.hubspotId,
        jiraId: primary.jiraId || secondary.jiraId,
        notionId: primary.notionId || secondary.notionId,
        googleId: primary.googleId || secondary.googleId,
        stripeCustomerId: primary.stripeCustomerId || secondary.stripeCustomerId,
      },
    }),
    prisma.universalEvent.updateMany({
      where: { actorId: secondaryId },
      data: { actorId: primaryId },
    }),
    prisma.orgActor.delete({ where: { id: secondaryId } }),
  ]);
}
