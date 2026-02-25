import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { GITHUB_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class GitHubAdapter implements IntegrationAdapter {
  readonly source: Source = 'GITHUB';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('github', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const page = cursor ? Number(cursor) : 1;
    const r = await this.client.executeAction(connectionId, 'GITHUB_LIST_EVENTS', { page, per_page: 100 });
    const d = Array.isArray(r.data) ? (r.data as Record<string, unknown>[]) : [];
    const events: RawExternalEvent[] = d.map((e) => ({
      id: e.id as string, type: e.type as string, timestamp: e.created_at as string, data: e,
      actor: { id: (e.actor as Record<string, unknown>)?.login as string },
    }));
    return { events, nextCursor: events.length === 100 ? String(page + 1) : null, hasMore: events.length === 100 };
  }

  async fetchIncremental(_orgId: string, connectionId: string, _since: Date) {
    const r = await this.client.executeAction(connectionId, 'GITHUB_LIST_EVENTS', { per_page: 100 });
    const d = Array.isArray(r.data) ? (r.data as Record<string, unknown>[]) : [];
    const events: RawExternalEvent[] = d.map((e) => ({
      id: e.id as string, type: e.type as string, timestamp: e.created_at as string, data: e,
      actor: { id: (e.actor as Record<string, unknown>)?.login as string },
    }));
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = GITHUB_EVENTS[raw.type];
    if (!m) return null;
    const payload = (raw.data.payload as Record<string, unknown>) || {};
    const action = payload.action as string;
    const eventType = action ? m.eventType.replace('.action', `.${action}`) : m.eventType;
    const entityId = String(
      (payload.pull_request as Record<string, unknown>)?.id ||
      (payload.issue as Record<string, unknown>)?.id ||
      (payload.release as Record<string, unknown>)?.id ||
      raw.id
    );
    return {
      orgId, source: 'GITHUB', eventType, actorId: raw.actor?.id || null,
      entityType: m.entityType, entityId,
      timestamp: new Date(raw.timestamp),
      metadata: { repo: (raw.data.repo as Record<string, unknown>)?.name, action },
      rawEventId,
    };
  }
}
