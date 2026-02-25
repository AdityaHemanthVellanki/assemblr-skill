'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS, formatRelative } from '@/lib/utils';

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
    <div>
      <Header title="Integrations" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SOURCES.map((source) => {
            const integration = integrations?.find((i: any) => i.source === source);
            const isConnected = connected.has(source);

            return (
              <div
                key={source}
                className="p-4 rounded-lg space-y-3"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: SOURCE_COLORS[source] || '#666' }}
                    />
                    <span className="font-medium text-sm">{SOURCE_LABELS[source]}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: isConnected ? '#dcfce7' : 'var(--muted)',
                      color: isConnected ? '#166534' : 'var(--muted-foreground)',
                    }}
                  >
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {integration?.lastSyncAt && (
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Last sync: {formatRelative(integration.lastSyncAt)}
                  </div>
                )}

                {integration?.errorMessage && (
                  <div className="text-xs text-red-500">{integration.errorMessage}</div>
                )}

                <div className="flex gap-2">
                  {!isConnected ? (
                    <button
                      onClick={() => handleConnect(source)}
                      disabled={connecting === source}
                      className="px-3 py-1.5 rounded text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {connecting === source ? 'Connecting...' : 'Connect'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBackfill(source)}
                      className="px-3 py-1.5 rounded text-xs font-medium transition hover:opacity-80"
                      style={{ background: 'var(--accent)' }}
                    >
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
