import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { NOTION_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class NotionAdapter implements IntegrationAdapter {
  readonly source: Source = 'NOTION';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('notion', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const r = await this.client.executeAction(connectionId, 'NOTION_SEARCH', {
      start_cursor: cursor, page_size: 100, sort: { direction: 'descending', timestamp: 'last_edited_time' },
    });
    const d = r.data as { results?: Record<string, unknown>[]; next_cursor?: string; has_more?: boolean };
    const events: RawExternalEvent[] = (d.results || []).map((item) => ({
      id: item.id as string, type: `${item.object}.created`,
      timestamp: (item.created_time as string) || new Date().toISOString(), data: item,
      actor: { id: (item.created_by as Record<string, unknown>)?.id as string },
    }));
    return { events, nextCursor: d.next_cursor || null, hasMore: d.has_more || false };
  }

  async fetchIncremental(_orgId: string, connectionId: string, since: Date) {
    const r = await this.client.executeAction(connectionId, 'NOTION_SEARCH', {
      page_size: 100, sort: { direction: 'descending', timestamp: 'last_edited_time' },
    });
    const d = r.data as { results?: Record<string, unknown>[] };
    const events: RawExternalEvent[] = (d.results || [])
      .filter((item) => new Date(item.last_edited_time as string) > since)
      .map((item) => ({
        id: item.id as string, type: `${item.object}.updated`,
        timestamp: item.last_edited_time as string, data: item,
        actor: { id: (item.last_edited_by as Record<string, unknown>)?.id as string },
      }));
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = NOTION_EVENTS[raw.type];
    if (!m) return null;
    return {
      orgId, source: 'NOTION', eventType: m.eventType, actorId: raw.actor?.id || null,
      entityType: m.entityType, entityId: raw.id, timestamp: new Date(raw.timestamp),
      metadata: { objectType: raw.data.object, url: raw.data.url },
      rawEventId,
    };
  }
}
