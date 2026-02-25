'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS, formatRelative } from '@/lib/utils';
import { Loader2, RefreshCw, Check, Unplug } from 'lucide-react';

const ALL_SOURCES = ['SLACK', 'GITHUB', 'HUBSPOT', 'JIRA', 'NOTION', 'GOOGLE'];

export default function IntegrationsPage() {
  const { data: integrations, refetch } = useApi<any[]>('/integrations');
  const [connecting, setConnecting] = useState<string | null>(null);

  const connected = new Set(integrations?.map((i: any) => i.source) || []);

  async function handleConnect(source: string) {
    setConnecting(source);
    try {
      await api('/integrations/connect', {
        method: 'POST',
        body: { source, connectionId: `demo-${source.toLowerCase()}-${Date.now()}` },
      });
      await refetch();
    } catch {
      // silently ignore
    } finally {
      setConnecting(null);
    }
  }

  async function handleBackfill(source: string) {
    try {
      await api('/integrations/backfill', { method: 'POST', body: { source } });
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="page-enter">
      <Header title="Integrations" />
      <div className="p-8">
        <p className="text-sm mb-6" style={{ color: 'var(--fg-muted)' }}>
          Connect your tools to start capturing cross-platform workflow data.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SOURCES.map((source) => {
            const integration = integrations?.find((i: any) => i.source === source);
            const isConnected = connected.has(source);
            const color = SOURCE_COLORS[source] || '#888';

            return (
              <div
                key={source}
                className="card card-glow space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                      }}
                    >
                      {SOURCE_LABELS[source]?.[0] || source[0]}
                    </div>
                    <div>
                      <span className="font-medium text-sm" style={{ color: 'var(--fg)' }}>
                        {SOURCE_LABELS[source]}
                      </span>
                      {integration?.lastSyncAt && (
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                          Synced {formatRelative(integration.lastSyncAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-dot ${isConnected ? 'badge-success' : 'badge-default'}`}>
                    {isConnected ? 'Connected' : 'Available'}
                  </span>
                </div>

                {/* Error */}
                {integration?.errorMessage && (
                  <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--error-muted)', color: 'var(--error)' }}>
                    {integration.errorMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {!isConnected ? (
                    <button
                      onClick={() => handleConnect(source)}
                      disabled={connecting === source}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      {connecting === source ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Unplug size={14} />
                          Connect
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBackfill(source)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <RefreshCw size={14} />
                      Backfill
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
