'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';

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

  return (
    <div>
      <Header title="Actors" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm flex-1 outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          />
          {mergeIds.length === 2 && (
            <button
              onClick={handleMerge}
              disabled={merging}
              className="px-4 py-2 rounded text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {merging ? 'Merging...' : 'Merge Selected'}
            </button>
          )}
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(!data?.data || data.data.length === 0) && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No actors found. Actors are created from identity resolution during event processing.
            </div>
          )}
          {data?.data?.map((actor: any, i: number) => (
            <div
              key={actor.id}
              className="flex items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:opacity-80 transition"
              style={{
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: mergeIds.includes(actor.id) ? 'var(--accent)' : 'transparent',
              }}
              onClick={() => toggleSelect(actor.id)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{ background: 'var(--muted)' }}
              >
                {(actor.displayName || actor.primaryEmail || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {actor.displayName || 'Unknown'}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {actor.primaryEmail || '—'}
                </div>
              </div>
              <div className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {Object.keys(actor.sourceIds || {}).length} sources
              </div>
              <div className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {formatRelative(actor.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
