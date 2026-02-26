'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';
import { Zap } from 'lucide-react';

export function TriggerNode({ data }: NodeProps) {
  const nodeData = data as Record<string, any>;
  const source = nodeData.source || '';
  const color = SOURCE_COLORS[source] || '#7c5cfc';

  return (
    <div
      className="px-4 py-3 rounded-xl min-w-[200px] relative"
      style={{
        background: 'var(--card)',
        border: `2px solid ${color}`,
        boxShadow: `0 0 16px color-mix(in srgb, ${color} 20%, transparent), var(--shadow-md)`,
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
        >
          <Zap size={11} style={{ color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
          {SOURCE_LABELS[source] || 'Trigger'}
        </span>
      </div>
      <div className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
        {nodeData.label}
      </div>
      {nodeData.eventType && (
        <div className="text-[10px] font-mono mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
          {nodeData.eventType}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          width: 10,
          height: 10,
          border: '2px solid var(--card)',
        }}
      />
    </div>
  );
}
