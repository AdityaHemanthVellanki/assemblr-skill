'use client';

import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'var(--accent-brand)', loading, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden p-6 gap-0', className)}>
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <span className="text-[32px] font-semibold text-foreground tabular-nums">{value}</span>
      )}
    </Card>
  );
}
