'use client';

import { Badge } from '@/components/ui/badge';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';

export function SourceBadge({ source, className }: { source: string; className?: string }) {
  const color = SOURCE_COLORS[source] || '#71717a';
  const label = SOURCE_LABELS[source] || source;

  return (
    <Badge
      variant="outline"
      className={className}
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      {label}
    </Badge>
  );
}
