'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';
import { Cog } from 'lucide-react';

export function SkillNode({ data }: NodeProps) {
  const nodeData = data as Record<string, any>;
  const source = nodeData.source || '';
  const color = SOURCE_COLORS[source] || 'var(--fg-muted)';

  return (
    <div
      className="px-4 py-3 rounded-xl min-w-[200px]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'var(--fg-muted)',
          width: 10,
          height: 10,
          border: '2px solid var(--bg-surface)',
        }}
      />
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Cog size={11} style={{ color }} />
        </div>
        <span className="text-[10px] font-medium" style={{ color: 'var(--fg-muted)' }}>
          {SOURCE_LABELS[source] || 'Action'}
        </span>
      </div>
      <div className="text-xs font-medium truncate" style={{ color: 'var(--fg)' }}>
        {nodeData.label}
      </div>
      {nodeData.eventType && (
        <div className="text-[10px] font-mono mt-1 truncate" style={{ color: 'var(--fg-muted)' }}>
          {nodeData.eventType}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--fg-muted)',
          width: 10,
          height: 10,
          border: '2px solid var(--bg-surface)',
        }}
      />
    </div>
  );
}
