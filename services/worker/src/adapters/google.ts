import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { GOOGLE_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class GoogleAdapter implements IntegrationAdapter {
  readonly source: Source = 'GOOGLE';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('googleworkspace', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const r = await this.client.executeAction(connectionId, 'GMAIL_LIST_MESSAGES', { maxResults: 100, pageToken: cursor });
    const d = r.data as { messages?: Record<string, unknown>[]; nextPageToken?: string };
    const events: RawExternalEvent[] = (d.messages || []).map((msg) => ({
      id: msg.id as string, type: 'email.received',
      timestamp: new Date(Number(msg.internalDate || Date.now())).toISOString(),
      data: { id: msg.id, threadId: msg.threadId, snippet: msg.snippet },
      actor: { email: msg.from as string },
    }));
    return { events, nextCursor: d.nextPageToken || null, hasMore: !!d.nextPageToken };
  }

  async fetchIncremental(_orgId: string, connectionId: string, since: Date) {
    const epoch = Math.floor(since.getTime() / 1000);
    const r = await this.client.executeAction(connectionId, 'GMAIL_LIST_MESSAGES', { maxResults: 100, q: `after:${epoch}` });
    const d = r.data as { messages?: Record<string, unknown>[] };
    const events: RawExternalEvent[] = (d.messages || []).map((msg) => ({
      id: msg.id as string, type: 'email.received',
      timestamp: new Date(Number(msg.internalDate || Date.now())).toISOString(),
      data: { id: msg.id, threadId: msg.threadId },
    }));
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = GOOGLE_EVENTS[raw.type];
    if (!m) return null;
    return {
      orgId, source: 'GOOGLE', eventType: m.eventType,
      actorId: raw.actor?.email || raw.actor?.id || null,
      entityType: m.entityType, entityId: raw.id, timestamp: new Date(raw.timestamp),
      metadata: { threadId: raw.data.threadId, snippet: raw.data.snippet ? String(raw.data.snippet).slice(0, 200) : undefined },
      rawEventId,
    };
  }
}
