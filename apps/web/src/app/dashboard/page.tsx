'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Plug, GitBranch, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats } = useApi<any>('/events/stats');
  const { data: integrations } = useApi<any[]>('/integrations');
  const { data: workflows } = useApi<any>('/workflows');

  const connectedCount = integrations?.filter((i: any) => i.status === 'CONNECTED').length || 0;

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="p-10 space-y-8">
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StaggerItem>
            <StatCard label="Total Events" value={stats?.total ?? '—'} icon={Activity} color="var(--accent-brand)" loading={!stats} />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Last 24h" value={stats?.last24h ?? '—'} icon={TrendingUp} color="var(--success)" loading={!stats} />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Integrations" value={connectedCount} icon={Plug} color="var(--info)" loading={!integrations} />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Workflows" value={workflows?.data?.length ?? '—'} icon={GitBranch} color="var(--warning)" loading={!workflows} />
          </StaggerItem>
        </StaggerContainer>

        {stats?.bySource?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Events by Source</h3>
            </div>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.bySource.map((s: any) => (
                <StaggerItem key={s.source}>
                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card className="p-5 gap-0 hover:border-muted-foreground/20 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[s.source] || 'var(--muted-foreground)' }} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {SOURCE_LABELS[s.source] || s.source}
                        </span>
                      </div>
                      <div className="text-xl font-semibold tabular-nums">{s.count.toLocaleString()}</div>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {stats?.topEventTypes?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Event Types</h3>
            </div>
            <Card className="p-0 gap-0 overflow-hidden">
              {stats.topEventTypes.map((t: any, i: number) => (
                <div
                  key={t.eventType}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                  style={{ borderBottom: i < stats.topEventTypes.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <span className="font-mono text-xs flex-1 truncate text-muted-foreground">{t.eventType}</span>
                  <span className="text-sm font-medium tabular-nums">{t.count.toLocaleString()}</span>
                </div>
              ))}
            </Card>
          </section>
        )}

        {!stats && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        )}

        {stats && !stats.total && !stats.bySource?.length && (
          <Card className="p-0">
            <EmptyState
              icon={Activity}
              title="No events yet"
              description="Connect your integrations and run a backfill to start seeing cross-tool workflow data here."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
