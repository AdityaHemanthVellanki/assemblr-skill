import type { Source, UniversalEventInput, EntityType } from '@assemblr/shared';

export interface RawExternalEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  data: Record<string, unknown>;
  actor?: { id?: string; email?: string; name?: string };
}

export interface IntegrationAdapter {
  readonly source: Source;

  connect(orgId: string, params: Record<string, unknown>): Promise<string>;
  disconnect(orgId: string, connectionId: string): Promise<void>;

  fetchBackfill(
    orgId: string,
    connectionId: string,
    cursor?: string,
  ): Promise<{ events: RawExternalEvent[]; nextCursor: string | null; hasMore: boolean }>;

  fetchIncremental(
    orgId: string,
    connectionId: string,
    since: Date,
  ): Promise<{ events: RawExternalEvent[]; cursor: string | null }>;

  normalize(
    orgId: string,
    rawEvent: RawExternalEvent,
    rawEventId: string,
  ): UniversalEventInput | null;
}

// ─── Event type maps per source ───

export const SLACK_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  message: { eventType: 'message.sent', entityType: 'message' },
  message_changed: { eventType: 'message.edited', entityType: 'message' },
  message_deleted: { eventType: 'message.deleted', entityType: 'message' },
  reaction_added: { eventType: 'reaction.added', entityType: 'reaction' },
  channel_created: { eventType: 'channel.created', entityType: 'channel' },
  member_joined_channel: { eventType: 'channel.member_joined', entityType: 'channel' },
  file_shared: { eventType: 'file.shared', entityType: 'file' },
};

export const GITHUB_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  PushEvent: { eventType: 'push.created', entityType: 'commit' },
  PullRequestEvent: { eventType: 'pull_request.action', entityType: 'pull_request' },
  PullRequestReviewEvent: { eventType: 'pull_request.reviewed', entityType: 'pull_request' },
  IssuesEvent: { eventType: 'issue.action', entityType: 'issue' },
  IssueCommentEvent: { eventType: 'issue.commented', entityType: 'issue' },
  ReleaseEvent: { eventType: 'release.created', entityType: 'release' },
  CreateEvent: { eventType: 'ref.created', entityType: 'repository' },
  DeleteEvent: { eventType: 'ref.deleted', entityType: 'repository' },
};

export const HUBSPOT_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  'deal.created': { eventType: 'deal.created', entityType: 'deal' },
  'deal.propertyChange': { eventType: 'deal.updated', entityType: 'deal' },
  'deal.stage_changed': { eventType: 'deal.stage_changed', entityType: 'deal' },
  'contact.created': { eventType: 'contact.created', entityType: 'contact' },
  'ticket.created': { eventType: 'ticket.created', entityType: 'ticket' },
};

export const JIRA_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  'jira:issue_created': { eventType: 'issue.created', entityType: 'task' },
  'jira:issue_updated': { eventType: 'issue.updated', entityType: 'task' },
  'jira:issue_deleted': { eventType: 'issue.deleted', entityType: 'task' },
  sprint_started: { eventType: 'sprint.started', entityType: 'sprint' },
  sprint_closed: { eventType: 'sprint.closed', entityType: 'sprint' },
  comment_created: { eventType: 'comment.created', entityType: 'task' },
};

export const NOTION_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  'page.created': { eventType: 'page.created', entityType: 'page' },
  'page.updated': { eventType: 'page.updated', entityType: 'page' },
  'database.created': { eventType: 'database.created', entityType: 'database' },
  'database.updated': { eventType: 'database.updated', entityType: 'database' },
};

export const GOOGLE_EVENTS: Record<string, { eventType: string; entityType: EntityType }> = {
  'email.received': { eventType: 'email.received', entityType: 'email' },
  'email.sent': { eventType: 'email.sent', entityType: 'email' },
  'document.created': { eventType: 'document.created', entityType: 'document' },
  'document.modified': { eventType: 'document.modified', entityType: 'document' },
  'calendar.event_created': { eventType: 'calendar.event_created', entityType: 'calendar_event' },
  'file.created': { eventType: 'file.created', entityType: 'file' },
};
