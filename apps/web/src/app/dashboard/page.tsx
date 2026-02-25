'use client';

import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';
import { Activity, Plug, GitBranch, Zap, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats } = useApi<any>('/events/stats');
  const { data: integrations } = useApi<any[]>('/integrations');
  const { data: workflows } = useApi<any>('/workflows');

  const connectedCount = integrations?.filter((i: any) => i.status === 'CONNECTED').length || 0;

  return (
    <div className="page-enter">
      <Header title="Dashboard" />
      <div className="p-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Events"
            value={stats?.total ?? '—'}
            icon={<Activity size={18} />}
            color="var(--accent)"
          />
          <StatCard
            label="Last 24h"
            value={stats?.last24h ?? '—'}
            icon={<TrendingUp size={18} />}
            color="var(--success)"
          />
          <StatCard
            label="Integrations"
            value={connectedCount}
            icon={<Plug size={18} />}
            color="var(--info)"
          />
          <StatCard
            label="Workflows"
            value={workflows?.data?.length ?? '—'}
            icon={<GitBranch size={18} />}
            color="var(--warning)"
          />
        </div>

        {/* Events by source */}
        {stats?.bySource?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} style={{ color: 'var(--fg-muted)' }} />
              <h3 className="section-title">Events by Source</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.bySource.map((s: any) => (
                <div key={s.source} className="card card-hover" style={{ padding: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: SOURCE_COLORS[s.source] || 'var(--fg-muted)' }}
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
                      {SOURCE_LABELS[s.source] || s.source}
                    </span>
                  </div>
                  <div className="text-xl font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {s.count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top event types */}
        {stats?.topEventTypes?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight size={14} style={{ color: 'var(--fg-muted)' }} />
              <h3 className="section-title">Top Event Types</h3>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {stats.topEventTypes.map((t: any, i: number) => (
                <div
                  key={t.eventType}
                  className="list-row"
                  style={{ borderBottom: i < stats.topEventTypes.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <span
                    className="font-mono text-xs flex-1 truncate"
                    style={{ color: 'var(--fg-secondary)' }}
                  >
                    {t.eventType}
                  </span>
                  <span className="text-sm font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {t.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state if no data */}
        {!stats?.total && !stats?.bySource?.length && (
          <div className="empty-state" style={{ minHeight: 300 }}>
            <div className="empty-icon">
              <Activity size={22} />
            </div>
            <div className="empty-title">No events yet</div>
            <div className="empty-description">
              Connect your integrations and run a backfill to start seeing cross-tool workflow data here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
