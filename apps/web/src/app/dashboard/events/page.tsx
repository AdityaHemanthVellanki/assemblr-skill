'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS, formatRelative } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import { SourceBadge } from '@/components/source-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div>
      <PageHeader title="Events" />
      <div className="p-10 space-y-5">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((src) => {
            const active = sourceFilter === src;
            const color = SOURCE_COLORS[src];
            return (
              <Button
                key={src || 'all'}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSourceFilter(src)}
                className={cn(
                  'rounded-full text-xs',
                  active && color && 'border-transparent',
                )}
                style={active && color ? {
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color,
                  borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                } : undefined}
              >
                {src ? SOURCE_LABELS[src] || src : 'All'}
              </Button>
            );
          })}
        </div>

        {/* Events list */}
        <Card className="p-0 gap-0 overflow-hidden">
          {events.length === 0 && !loading && (
            <EmptyState
              icon={Activity}
              title="No events found"
              description="Connect an integration and run a backfill to see events here."
            />
          )}

          {loading && events.length === 0 && (
            <div className="p-2 space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          )}

          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 px-6 py-3.5 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
            >
              <SourceBadge source={event.source} />
              <span className="font-mono text-xs flex-1 truncate text-muted-foreground">
                {event.eventType}
              </span>
              <span className="text-xs shrink-0 text-muted-foreground">
                {event.actor?.displayName || event.actor?.primaryEmail || '—'}
              </span>
              <span className="text-[11px] shrink-0 font-mono text-muted-foreground/60 min-w-[60px] text-right">
                {formatRelative(event.timestamp)}
              </span>
            </div>
          ))}
        </Card>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button onClick={() => cursor && fetchEvents(cursor)} disabled={loading} variant="secondary">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
