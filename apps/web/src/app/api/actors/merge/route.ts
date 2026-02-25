import { prisma } from '@assemblr/shared';
import { requireSession, requireRole } from '@/lib/auth';
import { handler, json, error } from '@/lib/api-utils';

export const POST = handler(async (req) => {
  const s = await requireSession();
  requireRole(s, 'OWNER', 'ADMIN');

  const { primaryId, secondaryId } = await req.json();
  if (!primaryId || !secondaryId) return error('primaryId and secondaryId required', 400);
  if (primaryId === secondaryId) return error('Cannot merge actor with itself', 400);

  const [primary, secondary] = await Promise.all([
    prisma.orgActor.findFirst({ where: { id: primaryId, orgId: s.orgId } }),
    prisma.orgActor.findFirst({ where: { id: secondaryId, orgId: s.orgId } }),
  ]);

  if (!primary || !secondary) return error('Actor not found', 404, 'NOT_FOUND');

  // Merge: move events from secondary to primary, merge source IDs, delete secondary
  const merged = await prisma.$transaction(async (tx) => {
    // Update primary with merged data (prefer primary's values, fill from secondary)
    const updated = await tx.orgActor.update({
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
      },
    });

    // Move all events from secondary to primary
    await tx.universalEvent.updateMany({
      where: { actorId: secondaryId },
      data: { actorId: primaryId },
    });

    // Delete secondary
    await tx.orgActor.delete({ where: { id: secondaryId } });

    return updated;
  });

  return json(merged);
});
