import { prisma, type BackfillPayload, type Source } from '@assemblr/shared';
import type { Job } from 'bullmq';
import type { IntegrationAdapter } from '../adapters/interface.js';
import { SlackAdapter } from '../adapters/slack.js';
import { GitHubAdapter } from '../adapters/github.js';
import { HubSpotAdapter } from '../adapters/hubspot.js';
import { JiraAdapter } from '../adapters/jira.js';
import { NotionAdapter } from '../adapters/notion.js';
import { GoogleAdapter } from '../adapters/google.js';

const adapters: Record<string, IntegrationAdapter> = {
  SLACK: new SlackAdapter(),
  GITHUB: new GitHubAdapter(),
  HUBSPOT: new HubSpotAdapter(),
  JIRA: new JiraAdapter(),
  NOTION: new NotionAdapter(),
  GOOGLE: new GoogleAdapter(),
};

export async function handleBackfill(job: Job<BackfillPayload>) {
  const { orgId, source } = job.data;

  const adapter = adapters[source];
  if (!adapter) throw new Error(`No adapter for ${source}`);

  const integration = await prisma.integration.findFirst({
    where: { orgId, source: source as any, status: 'CONNECTED' },
  });
  if (!integration?.composioConnectionId) throw new Error('Integration not connected');

  let totalIngested = 0;
  let cursor = integration.syncCursor || undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await adapter.fetchBackfill(orgId, integration.composioConnectionId, cursor);

    for (const rawEvent of result.events) {
      // Store raw event
      const raw = await prisma.rawEvent.create({
        data: { orgId, source: source as any, rawPayload: rawEvent.data as any },
      });

      // Normalize and store
      const normalized = adapter.normalize(orgId, rawEvent, raw.id);
      if (normalized) {
        await prisma.universalEvent.create({
          data: {
            orgId: normalized.orgId,
            source: normalized.source as any,
            eventType: normalized.eventType,
            actorId: normalized.actorId,
            entityType: normalized.entityType,
            entityId: normalized.entityId,
            timestamp: normalized.timestamp,
            metadata: normalized.metadata as any,
            rawEventId: raw.id,
          },
        });
        totalIngested++;
      }
    }

    cursor = result.nextCursor || undefined;
    hasMore = result.hasMore && result.events.length > 0;

    await job.updateProgress({ ingested: totalIngested });

    // Save cursor for resumption
    await prisma.integration.update({
      where: { id: integration.id },
      data: { syncCursor: cursor || null, lastSyncAt: new Date() },
    });
  }

  return { totalIngested };
}
