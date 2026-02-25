'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TriggerNode } from './trigger-node';
import { SkillNode } from './skill-node';

interface SkillGraphEditorProps {
  nodes: any[];
  edges: any[];
  onNodesChange?: (nodes: any[]) => void;
  onEdgesChange?: (edges: any[]) => void;
}

function toFlowNodes(raw: any[]): Node[] {
  if (!raw?.length) return [];
  return raw.map((n, i) => ({
    id: n.id || `node-${i}`,
    type: n.type === 'trigger' ? 'trigger' : 'skill',
    position: n.position || { x: 100 + i * 250, y: 100 + (i % 2) * 100 },
    data: {
      label: n.label || n.eventType || n.data?.label || 'Node',
      eventType: n.eventType || n.data?.eventType || '',
      source: n.source || n.data?.source || '',
      ...n.data,
    },
  }));
}

function toFlowEdges(raw: any[]): Edge[] {
  if (!raw?.length) return [];
  return raw.map((e, i) => ({
    id: e.id || `edge-${i}`,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: 'var(--muted-foreground)', strokeWidth: 1.5 },
    label: e.label || e.condition || '',
  }));
}

export function SkillGraphEditor({ nodes: rawNodes, edges: rawEdges, onNodesChange: onNodesSave, onEdgesChange: onEdgesSave }: SkillGraphEditorProps) {
  const initialNodes = useMemo(() => toFlowNodes(rawNodes), [rawNodes]);
  const initialEdges = useMemo(() => toFlowEdges(rawEdges), [rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes: NodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    skill: SkillNode,
  }), []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...connection, animated: true, style: { stroke: 'var(--muted-foreground)', strokeWidth: 1.5 } }, eds);
        onEdgesSave?.(newEdges);
        return newEdges;
      });
    },
    [setEdges, onEdgesSave]
  );

  const onNodeDragStop = useCallback(() => {
    onNodesSave?.(nodes.map((n) => ({
      id: n.id, type: n.type, position: n.position, data: n.data,
    })));
  }, [nodes, onNodesSave]);

  if (!rawNodes?.length && !rawEdges?.length) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--muted)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No graph data yet. Compile a workflow to generate the skill graph.
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls />
      <MiniMap
        nodeStrokeWidth={2}
        style={{ background: 'var(--muted)' }}
      />
    </ReactFlow>
  );
}
