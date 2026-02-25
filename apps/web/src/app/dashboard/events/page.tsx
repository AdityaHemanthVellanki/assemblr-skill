'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, formatRelative } from '@/lib/utils';

interface EventData {
  data: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

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
    <div>
      <Header title="Events" />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {['', 'SLACK', 'GITHUB', 'HUBSPOT', 'JIRA', 'NOTION', 'GOOGLE'].map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className="px-3 py-1.5 rounded text-xs font-medium transition"
              style={{
                background: sourceFilter === src ? 'var(--primary)' : 'var(--muted)',
                color: sourceFilter === src ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {src ? SOURCE_LABELS[src] || src : 'All'}
            </button>
          ))}
        </div>

        {/* Events list */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {events.length === 0 && !loading && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No events found. Connect an integration and run a backfill.
            </div>
          )}
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex items-center gap-4 px-4 py-3 text-sm"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
            >
              <span
                className="shrink-0 text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--muted)' }}
              >
                {SOURCE_LABELS[event.source] || event.source}
              </span>
              <span className="font-mono text-xs flex-1 truncate">{event.eventType}</span>
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {event.actor?.displayName || event.actor?.primaryEmail || '—'}
              </span>
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {formatRelative(event.timestamp)}
              </span>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => cursor && fetchEvents(cursor)}
            disabled={loading}
            className="px-4 py-2 rounded text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
}
