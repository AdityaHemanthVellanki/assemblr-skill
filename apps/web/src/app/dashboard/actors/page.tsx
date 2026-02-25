'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';
import { Users, Search, Merge, Loader2, Check } from 'lucide-react';

export default function ActorsPage() {
  const [search, setSearch] = useState('');
  const { data, refetch } = useApi<any>(`/actors?search=${encodeURIComponent(search)}&limit=50`);
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);

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
    } finally {
      setMerging(false);
    }
  }

  function toggleSelect(id: string) {
    setMergeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  }

  const AVATAR_COLORS = [
    '#7c5cfc', '#e01e5a', '#2684ff', '#ff7a59', '#22c55e', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
  ];

  function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  return (
    <div className="page-enter">
      <Header title="Actors">
        {mergeIds.length === 2 && (
          <button
            onClick={handleMerge}
            disabled={merging}
            className="btn btn-primary btn-sm"
          >
            {merging ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Merge size={14} />
                Merge Selected
              </>
            )}
          </button>
        )}
      </Header>
      <div className="p-8 space-y-5">
        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--fg-muted)' }}
          />
          <input
            type="text"
            placeholder="Search actors by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 40 }}
          />
        </div>

        {mergeIds.length > 0 && (
          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            {mergeIds.length}/2 actors selected for merge. Click actors to select.
          </div>
        )}

        {/* Actors list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {(!data?.data || data.data.length === 0) && (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={22} />
              </div>
              <div className="empty-title">No actors found</div>
              <div className="empty-description">
                Actors are created from identity resolution during event processing.
              </div>
            </div>
          )}
          {data?.data?.map((actor: any) => {
            const selected = mergeIds.includes(actor.id);
            const displayChar = (actor.displayName || actor.primaryEmail || '?')[0].toUpperCase();
            const avatarColor = getAvatarColor(actor.displayName || actor.primaryEmail || '?');

            return (
              <div
                key={actor.id}
                className="list-row cursor-pointer transition-all duration-150"
                style={{
                  background: selected ? 'var(--accent-muted)' : 'transparent',
                  borderLeft: selected ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onClick={() => toggleSelect(actor.id)}
              >
                {/* Avatar */}
                <div
                  className="avatar avatar-md"
                  style={{
                    background: `color-mix(in srgb, ${avatarColor} 15%, transparent)`,
                    color: avatarColor,
                  }}
                >
                  {selected ? <Check size={16} /> : displayChar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--fg)' }}>
                    {actor.displayName || 'Unknown'}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                    {actor.primaryEmail || '—'}
                  </div>
                </div>

                {/* Sources */}
                <span className="badge badge-default shrink-0">
                  {[actor.slackId, actor.githubId, actor.hubspotId, actor.jiraId, actor.notionId, actor.googleId].filter(Boolean).length} sources
                </span>

                {/* Time */}
                <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--fg-faint)', minWidth: 56 }}>
                  {formatRelative(actor.updatedAt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
