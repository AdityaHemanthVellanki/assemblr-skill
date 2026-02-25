'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS, formatRelative } from '@/lib/utils';
import { Activity, Loader2 } from 'lucide-react';

interface EventData {
  data: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

const FILTERS = ['', 'SLACK', 'GITHUB', 'HUBSPOT', 'JIRA', 'NOTION', 'GOOGLE'];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchEvents = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.set('source', sourceFilter);
      if (nextCursor) params.set('cursor', nextCursor);
      params.set('limit', '30');

      const res = await api<EventData>(`/events?${params}`);
      if (nextCursor) {
        setEvents((prev) => [...prev, ...res.data]);
      } else {
        setEvents(res.data);
      }
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="page-enter">
      <Header title="Events" />
      <div className="p-8 space-y-5">
        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((src) => {
            const active = sourceFilter === src;
            const color = SOURCE_COLORS[src];
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: active ? (color ? `color-mix(in srgb, ${color} 15%, transparent)` : 'var(--accent-muted)') : 'var(--bg-surface)',
                  color: active ? (color || 'var(--accent)') : 'var(--fg-muted)',
                  border: `1px solid ${active ? (color ? `color-mix(in srgb, ${color} 30%, transparent)` : 'var(--accent)') : 'var(--border)'}`,
                }}
              >
                {src ? SOURCE_LABELS[src] || src : 'All'}
              </button>
            );
          })}
        </div>

        {/* Events list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {events.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <div className="empty-icon">
                <Activity size={22} />
              </div>
              <div className="empty-title">No events found</div>
              <div className="empty-description">
                Connect an integration and run a backfill to see events here.
              </div>
            </div>
          )}
          {events.map((event, i) => (
            <div
              key={event.id}
              className="list-row"
            >
              {/* Source badge */}
              <span
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md"
                style={{
                  background: `color-mix(in srgb, ${SOURCE_COLORS[event.source] || '#888'} 12%, transparent)`,
                  color: SOURCE_COLORS[event.source] || 'var(--fg-muted)',
                }}
              >
                {SOURCE_LABELS[event.source] || event.source}
              </span>

              {/* Event type */}
              <span className="font-mono text-xs flex-1 truncate" style={{ color: 'var(--fg-secondary)' }}>
                {event.eventType}
              </span>

              {/* Actor */}
              <span className="text-xs shrink-0" style={{ color: 'var(--fg-muted)' }}>
                {event.actor?.displayName || event.actor?.primaryEmail || '—'}
              </span>

              {/* Time */}
              <span
                className="text-[11px] shrink-0 font-mono"
                style={{ color: 'var(--fg-faint)', minWidth: 60, textAlign: 'right' }}
              >
                {formatRelative(event.timestamp)}
              </span>
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => cursor && fetchEvents(cursor)}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
