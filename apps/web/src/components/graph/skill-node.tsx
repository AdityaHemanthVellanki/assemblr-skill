'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';

export function SkillNode({ data }: NodeProps) {
  const nodeData = data as Record<string, any>;
  const source = nodeData.source || '';
  const color = SOURCE_COLORS[source] || '#888';

  return (
    <div
      className="px-4 py-3 rounded-lg shadow-sm min-w-[180px]"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--muted-foreground)' }} />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {SOURCE_LABELS[source] || 'Action'}
        </span>
      </div>
      <div className="text-xs font-medium truncate">{nodeData.label}</div>
      {nodeData.eventType && (
        <div className="text-[10px] font-mono mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
          {nodeData.eventType}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--muted-foreground)' }} />
    </div>
  );
}
