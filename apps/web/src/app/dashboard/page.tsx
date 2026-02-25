'use client';

import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { SOURCE_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats } = useApi<any>('/events/stats');
  const { data: integrations } = useApi<any[]>('/integrations');
  const { data: workflows } = useApi<any>('/workflows');

  const connectedCount = integrations?.filter((i: any) => i.status === 'CONNECTED').length || 0;

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Events" value={stats?.total ?? '—'} />
          <StatCard label="Last 24h" value={stats?.last24h ?? '—'} />
          <StatCard label="Integrations" value={connectedCount} />
          <StatCard label="Workflows" value={workflows?.data?.length ?? '—'} />
        </div>

        {/* Events by source */}
        {stats?.bySource?.length > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Events by Source
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.bySource.map((s: any) => (
                <div
                  key={s.source} className="p-3 rounded-lg"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {SOURCE_LABELS[s.source] || s.source}
                  </div>
                  <div className="text-lg font-semibold mt-1">{s.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top event types */}
        {stats?.topEventTypes?.length > 0 && (
          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Top Event Types
            </h3>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              {stats.topEventTypes.map((t: any, i: number) => (
                <div
                  key={t.eventType}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <span className="font-mono text-xs">{t.eventType}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{t.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div className="text-2xl font-semibold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
