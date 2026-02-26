'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Merge, Loader2, Check } from 'lucide-react';

const AVATAR_COLORS = ['#7c5cfc', '#e01e5a', '#2684ff', '#ff7a59', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ActorsPage() {
  const [search, setSearch] = useState('');
  const { data, refetch } = useApi<any>(`/actors?search=${encodeURIComponent(search)}&limit=50`);
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  async function handleMerge() {
    if (mergeIds.length !== 2) return;
    setMerging(true);
    try {
      await api('/actors/merge', {
        method: 'POST',
        body: { primaryId: mergeIds[0], secondaryId: mergeIds[1] },
      });
      setMergeIds([]);
      await refetch();
      toast.success('Actors merged successfully');
    } catch (err: any) {
      toast.error(err.message || 'Merge failed');
    } finally {
      setMerging(false);
      setMergeOpen(false);
    }
  }

  function toggleSelect(id: string) {
    setMergeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  }

  return (
    <div>
      <PageHeader title="Actors">
        {mergeIds.length === 2 && (
          <Button onClick={() => setMergeOpen(true)} disabled={merging} size="sm" variant="glow">
            {merging ? <Loader2 size={14} className="animate-spin" /> : <><Merge size={14} /> Merge Selected</>}
          </Button>
        )}
      </PageHeader>
      <div className="p-10 space-y-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search actors by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {mergeIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {mergeIds.length}/2 actors selected for merge. Click actors to select.
          </p>
        )}

        <Card className="p-0 gap-0 overflow-hidden">
          {!data && (
            <div className="p-2 space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {data && (!data.data || data.data.length === 0) && (
            <EmptyState
              icon={Users}
              title="No actors found"
              description="Actors are created from identity resolution during event processing."
            />
          )}

          {data?.data?.map((actor: any) => {
            const selected = mergeIds.includes(actor.id);
            const displayChar = (actor.displayName || actor.primaryEmail || '?')[0].toUpperCase();
            const avatarColor = getAvatarColor(actor.displayName || actor.primaryEmail || '?');

            return (
              <div
                key={actor.id}
                className="flex items-center gap-4 px-6 py-3.5 border-b border-border/50 last:border-b-0 cursor-pointer transition-all duration-150 hover:bg-muted/50"
                style={{
                  background: selected ? 'var(--accent-brand-muted)' : undefined,
                  borderLeft: selected ? '3px solid var(--accent-brand)' : '3px solid transparent',
                }}
                onClick={() => toggleSelect(actor.id)}
              >
                <Avatar className="h-11 w-11">
                  <AvatarFallback
                    style={{
                      background: `color-mix(in srgb, ${avatarColor} 15%, transparent)`,
                      color: avatarColor,
                    }}
                    className="font-semibold"
                  >
                    {selected ? <Check size={18} /> : displayChar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-foreground">{actor.displayName || 'Unknown'}</div>
                  <div className="text-xs truncate mt-0.5 text-muted-foreground">{actor.primaryEmail || '—'}</div>
                </div>
                <Badge variant="default" className="shrink-0">
                  {[actor.slackId, actor.githubId, actor.hubspotId, actor.jiraId, actor.notionId, actor.googleId].filter(Boolean).length} sources
                </Badge>
                <span className="text-[11px] font-mono shrink-0 text-muted-foreground/60 min-w-[56px]">
                  {formatRelative(actor.updatedAt)}
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      <ConfirmDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Merge Actors"
        description="This will merge the two selected actors into one. The first selected actor will be the primary. This action cannot be undone."
        confirmText="Merge"
        onConfirm={handleMerge}
      />
    </div>
  );
}
