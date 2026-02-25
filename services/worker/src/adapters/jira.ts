import type { IntegrationAdapter, RawExternalEvent } from './interface.js';
import { JIRA_EVENTS } from './interface.js';
import { ComposioClient } from '../services/composio.js';
import type { Source, UniversalEventInput } from '@assemblr/shared';

export class JiraAdapter implements IntegrationAdapter {
  readonly source: Source = 'JIRA';
  private client = new ComposioClient();

  async connect(orgId: string, params: Record<string, unknown>) {
    const r = await this.client.initiateConnection('jira', orgId, params.redirectUrl as string);
    return r.connectionId;
  }
  async disconnect() {}

  async fetchBackfill(_orgId: string, connectionId: string, cursor?: string) {
    const startAt = cursor ? Number(cursor) : 0;
    const r = await this.client.executeAction(connectionId, 'JIRA_SEARCH_ISSUES', {
      jql: 'ORDER BY created DESC', startAt, maxResults: 100,
    });
    const d = r.data as { issues?: Record<string, unknown>[]; total?: number };
    const events: RawExternalEvent[] = (d.issues || []).map((issue) => {
      const f = issue.fields as Record<string, unknown>;
      return {
        id: issue.id as string, type: 'jira:issue_created', timestamp: f.created as string, data: issue,
        actor: { id: (f.creator as Record<string, unknown>)?.accountId as string, email: (f.creator as Record<string, unknown>)?.emailAddress as string },
      };
    });
    const next = startAt + events.length;
    return { events, nextCursor: next < (d.total || 0) ? String(next) : null, hasMore: next < (d.total || 0) };
  }

  async fetchIncremental(_orgId: string, connectionId: string, since: Date) {
    const r = await this.client.executeAction(connectionId, 'JIRA_SEARCH_ISSUES', {
      jql: `updated >= "${since.toISOString().split('T')[0]}" ORDER BY updated DESC`, maxResults: 100,
    });
    const d = r.data as { issues?: Record<string, unknown>[] };
    const events: RawExternalEvent[] = (d.issues || []).map((issue) => {
      const f = issue.fields as Record<string, unknown>;
      return { id: issue.id as string, type: 'jira:issue_updated', timestamp: f.updated as string, data: issue };
    });
    return { events, cursor: null };
  }

  normalize(orgId: string, raw: RawExternalEvent, rawEventId: string): UniversalEventInput | null {
    const m = JIRA_EVENTS[raw.type];
    if (!m) return null;
    const f = (raw.data.fields as Record<string, unknown>) || {};
    return {
      orgId, source: 'JIRA', eventType: m.eventType, actorId: raw.actor?.id || null,
      entityType: m.entityType, entityId: (raw.data.key as string) || raw.id,
      timestamp: new Date(raw.timestamp),
      metadata: { issueKey: raw.data.key, priority: (f.priority as Record<string, unknown>)?.name, status: (f.status as Record<string, unknown>)?.name, project: (f.project as Record<string, unknown>)?.key },
      rawEventId,
    };
  }
}
