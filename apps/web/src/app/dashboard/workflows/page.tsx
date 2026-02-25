'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';
import { GitBranch, Loader2, Radar, ArrowRight, ChevronRight } from 'lucide-react';

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
    <div className="page-enter">
      <Header title="Workflows">
        <button
          onClick={handleDetect}
          disabled={detecting}
          className="btn btn-primary btn-sm"
        >
          {detecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Radar size={14} />
              Detect Workflows
            </>
          )}
        </button>
      </Header>
      <div className="p-8 space-y-5">
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          Cross-tool workflow patterns detected from your event data.
        </p>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {(!data?.data || data.data.length === 0) && (
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <div className="empty-icon">
                <GitBranch size={22} />
              </div>
              <div className="empty-title">No workflows detected</div>
              <div className="empty-description">
                Collect events from your integrations and run detection to discover cross-tool patterns.
              </div>
            </div>
          )}
          {data?.data?.map((cluster: any) => (
            <Link
              key={cluster.id}
              href={`/dashboard/workflows/${cluster.id}`}
              className="list-row group"
              style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
              >
                <GitBranch size={16} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--fg)' }}>
                  {cluster.anchorEventType}
                </div>
                <div className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--fg-muted)' }}>
                  {(cluster.eventSequence || []).join(' → ')}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="badge badge-default">
                  {cluster._count?.instances || 0} instances
                </span>
                <span className="badge badge-accent">
                  {(cluster.confidenceScore * 100).toFixed(0)}%
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--fg-faint)', minWidth: 56 }}>
                  {formatRelative(cluster.updatedAt)}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--fg-faint)' }} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
