'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { formatRelative } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GitBranch, Loader2, Radar, ChevronRight } from 'lucide-react';

export default function WorkflowsPage() {
  const { data, refetch } = useApi<any>('/workflows');
  const [detecting, setDetecting] = useState(false);

  async function handleDetect() {
    setDetecting(true);
    try {
      await api('/workflows/detect', { method: 'POST' });
      toast.success('Workflow detection started');
      setTimeout(() => refetch(), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Detection failed');
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Workflows">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleDetect} disabled={detecting} size="sm" variant="glow">
              {detecting ? <Loader2 size={14} className="animate-spin" /> : <><Radar size={14} /> Detect Workflows</>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Scan event data for cross-tool workflow patterns</TooltipContent>
        </Tooltip>
      </PageHeader>
      <div className="p-10 space-y-5">
        <p className="text-sm text-muted-foreground">
          Cross-tool workflow patterns detected from your event data.
        </p>

        <Card className="p-0 gap-0 overflow-hidden">
          {!data && (
            <div className="p-2 space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {data && (!data.data || data.data.length === 0) && (
            <EmptyState
              icon={GitBranch}
              title="No workflows detected"
              description="Collect events from your integrations and run detection to discover cross-tool patterns."
            />
          )}

          {data?.data?.map((cluster: any) => (
            <Link
              key={cluster.id}
              href={`/dashboard/workflows/${cluster.id}`}
              className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors group no-underline text-inherit"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <GitBranch size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-foreground">{cluster.anchorEventType}</div>
                <div className="text-[11px] mt-0.5 font-mono truncate text-muted-foreground">
                  {(cluster.eventSequence || []).join(' → ')}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="default">{cluster._count?.instances || 0} instances</Badge>
                <Badge variant="accent">{(cluster.confidenceScore * 100).toFixed(0)}%</Badge>
                <span className="text-[11px] font-mono text-muted-foreground/60 min-w-[56px]">{formatRelative(cluster.updatedAt)}</span>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}
