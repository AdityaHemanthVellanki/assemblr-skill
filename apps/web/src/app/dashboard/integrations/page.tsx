'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS, formatRelative } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, Unplug } from 'lucide-react';

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
      toast.success(`${SOURCE_LABELS[source]} connected`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect');
    } finally {
      setConnecting(null);
    }
  }

  async function handleBackfill(source: string) {
    try {
      await api('/integrations/backfill', { method: 'POST', body: { source } });
      toast.success(`Backfill started for ${SOURCE_LABELS[source]}`);
    } catch (err: any) {
      toast.error(err.message || 'Backfill failed');
    }
  }

  return (
    <div>
      <PageHeader title="Integrations" />
      <div className="p-10">
        <p className="text-sm text-muted-foreground mb-6">
          Connect your tools to start capturing cross-platform workflow data.
        </p>

        {!integrations ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 gap-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALL_SOURCES.map((source) => {
              const integration = integrations?.find((i: any) => i.source === source);
              const isConnected = connected.has(source);
              const color = SOURCE_COLORS[source] || '#888';

              return (
                <StaggerItem key={source}>
                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card className="p-6 gap-0 space-y-4 relative overflow-hidden hover:border-primary/30 transition-colors">
                      {/* Glow line on connected */}
                      {isConnected && (
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold"
                            style={{
                              background: `color-mix(in srgb, ${color} 15%, transparent)`,
                              color,
                              border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                            }}
                          >
                            {SOURCE_LABELS[source]?.[0] || source[0]}
                          </div>
                          <div>
                            <span className="font-medium text-sm text-foreground">{SOURCE_LABELS[source]}</span>
                            {integration?.lastSyncAt && (
                              <div className="text-[11px] mt-0.5 text-muted-foreground">
                                Synced {formatRelative(integration.lastSyncAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={isConnected ? 'success' : 'default'} dot>
                          {isConnected ? 'Connected' : 'Available'}
                        </Badge>
                      </div>

                      {integration?.errorMessage && (
                        <div className="text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive">
                          {integration.errorMessage}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        {!isConnected ? (
                          <Button onClick={() => handleConnect(source)} disabled={connecting === source} size="sm" variant="glow" className="flex-1">
                            {connecting === source ? <Loader2 size={14} className="animate-spin" /> : <><Unplug size={14} /> Connect</>}
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={() => handleBackfill(source)} variant="secondary" size="sm" className="flex-1">
                                <RefreshCw size={14} /> Backfill
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pull historical events from {SOURCE_LABELS[source]}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
