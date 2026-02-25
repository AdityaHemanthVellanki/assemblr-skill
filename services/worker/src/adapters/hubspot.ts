import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { HUBSPOT_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class HubSpotAdapter implements IntegrationAdapter {
  readonly source: Source = 'HUBSPOT';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('hubspot', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const r = await this.client.executeAction(connectionId, 'HUBSPOT_LIST_DEALS', { after: cursor, limit: 100 });
    const d = r.data as { results?: Record<string, unknown>[]; paging?: { next?: { after?: string } } };
    const events: RawExternalEvent[] = (d.results || []).map((item) => ({
      id: item.id as string, type: 'deal.created', timestamp: (item.createdAt as string) || new Date().toISOString(),
      data: item, actor: { id: (item.properties as Record<string, unknown>)?.hubspot_owner_id as string },
    }));
    return { events, nextCursor: d.paging?.next?.after || null, hasMore: !!d.paging?.next?.after };
  }

  async fetchIncremental(_orgId: string, connectionId: string, since: Date) {
    const r = await this.client.executeAction(connectionId, 'HUBSPOT_LIST_DEALS', {
      filterGroups: [{ filters: [{ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: since.toISOString() }] }], limit: 100,
    });
    const d = r.data as { results?: Record<string, unknown>[] };
    const events: RawExternalEvent[] = (d.results || []).map((item) => ({
      id: item.id as string, type: 'deal.propertyChange', timestamp: (item.updatedAt as string) || new Date().toISOString(), data: item,
    }));
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = HUBSPOT_EVENTS[raw.type];
    if (!m) return null;
    const props = (raw.data.properties as Record<string, unknown>) || {};
    return {
      orgId, source: 'HUBSPOT', eventType: m.eventType, actorId: (props.hubspot_owner_id as string) || null,
      entityType: m.entityType, entityId: raw.id, timestamp: new Date(raw.timestamp),
      metadata: { dealStage: props.dealstage, dealName: props.dealname, amount: props.amount },
      rawEventId,
    };
  }
}
