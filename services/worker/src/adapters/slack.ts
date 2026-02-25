import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { SLACK_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class SlackAdapter implements IntegrationAdapter {
  readonly source: Source = 'SLACK';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('slack', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const r = await this.client.executeAction(connectionId, 'SLACK_LIST_MESSAGES', { cursor, limit: 200 });
    const d = r.data as { messages?: Record<string, unknown>[]; next_cursor?: string };
    const events: RawExternalEvent[] = (d.messages || []).map((m) => ({
      id: m.ts as string,
      type: (m.subtype as string) || 'message',
      timestamp: new Date(Number(m.ts) * 1000).toISOString(),
      data: m,
      actor: { id: m.user as string },
    }));
    return { events, nextCursor: d.next_cursor || null, hasMore: !!d.next_cursor };
  }

  async fetchIncremental(_orgId: string, connectionId: string, since: Date) {
    const r = await this.client.executeAction(connectionId, 'SLACK_LIST_MESSAGES', { oldest: String(since.getTime() / 1000), limit: 200 });
    const d = r.data as { messages?: Record<string, unknown>[] };
    const events: RawExternalEvent[] = (d.messages || []).map((m) => ({
      id: m.ts as string,
      type: (m.subtype as string) || 'message',
      timestamp: new Date(Number(m.ts) * 1000).toISOString(),
      data: m,
      actor: { id: m.user as string },
    }));
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = SLACK_EVENTS[raw.type];
    if (!m) return null;
    return {
      orgId, source: 'SLACK', eventType: m.eventType,
      actorId: raw.actor?.id || null,
      entityType: m.entityType, entityId: raw.id,
      timestamp: new Date(raw.timestamp),
      metadata: { channel: raw.data.channel, text: raw.data.text ? String(raw.data.text).slice(0, 500) : undefined },
      rawEventId,
    };
  }
}
