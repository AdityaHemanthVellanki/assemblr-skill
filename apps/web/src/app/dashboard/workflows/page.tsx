'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';

export default function WorkflowsPage() {
  const { data, refetch } = useApi<any>('/workflows');
  const [detecting, setDetecting] = useState(false);

  async function handleDetect() {
    setDetecting(true);
    try {
      await api('/workflows/detect', { method: 'POST' });
      setTimeout(() => refetch(), 2000);
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div>
      <Header title="Workflows" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Detected cross-tool workflow patterns from your event data.
          </p>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="px-4 py-2 rounded text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {detecting ? 'Detecting...' : 'Detect Workflows'}
          </button>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(!data?.data || data.data.length === 0) && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No workflows detected yet. Collect some events and run detection.
            </div>
          )}
          {data?.data?.map((cluster: any, i: number) => (
            <Link
              key={cluster.id}
              href={`/dashboard/workflows/${cluster.id}`}
              className="flex items-center gap-4 px-4 py-3 text-sm hover:opacity-80 transition"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', display: 'flex' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {cluster.anchorEventType}
                </div>
                <div className="text-xs mt-0.5 font-mono truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {(cluster.eventSequence || []).join(' → ')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {cluster._count?.instances || 0} instances
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {(cluster.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {formatRelative(cluster.updatedAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
