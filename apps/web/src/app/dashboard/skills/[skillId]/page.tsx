'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SkillGraphEditor } from '@/components/graph/skill-graph-editor';

export default function SkillDetailPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const router = useRouter();
  const { data: skill, refetch } = useApi<any>(`/skills/${skillId}`);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const latestVersion = skill?.versions?.[0];

  async function handleSave() {
    await api(`/skills/${skillId}`, {
      method: 'PATCH',
      body: { name, description },
    });
    setEditing(false);
    await refetch();
  }

  async function handleNewVersion() {
    await api(`/skills/${skillId}/version`, { method: 'POST' });
    await refetch();
  }

  async function handleExport() {
    const data = await api(`/skills/${skillId}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill?.name || 'skill'}-v${latestVersion?.version || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm('Delete this skill? This cannot be undone.')) return;
    await api(`/skills/${skillId}`, { method: 'DELETE' });
    router.push('/dashboard/skills');
  }

  async function handleNodesChange(nodes: any[]) {
    if (!latestVersion) return;
    await api(`/skills/${skillId}/nodes`, {
      method: 'PUT',
      body: { nodes, versionId: latestVersion.id },
    });
  }

  async function handleEdgesChange(edges: any[]) {
    if (!latestVersion) return;
    await api(`/skills/${skillId}/edges`, {
      method: 'PUT',
      body: { edges, versionId: latestVersion.id },
    });
  }

  if (!skill) {
    return (
      <div>
        <Header title="Skill" />
        <div className="p-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={skill.name} />
      <div className="p-6 space-y-4 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: skill.status === 'ACTIVE' ? '#dcfce7' : 'var(--muted)',
              color: skill.status === 'ACTIVE' ? '#166534' : 'var(--muted-foreground)',
            }}
          >
            {skill.status}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            v{latestVersion?.version || 1} · {skill.versions?.length || 0} versions
          </span>

          <div className="flex-1" />

          <button
            onClick={() => { setName(skill.name); setDescription(skill.description || ''); setEditing(true); }}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Edit
          </button>
          <button
            onClick={handleNewVersion}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            New Version
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Export JSON
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded text-xs font-medium text-red-500"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Delete
          </button>
        </div>

        {editing && (
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              />
              <input
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              />
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Save
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded text-sm"
              style={{ background: 'var(--muted)' }}>
              Cancel
            </button>
          </div>
        )}

        {skill.cluster && (
          <div className="text-xs space-y-1" style={{ color: 'var(--muted-foreground)' }}>
            <div>Anchor: <span className="font-mono">{skill.cluster.anchorEventType}</span></div>
            <div>Sequence: <span className="font-mono">{(skill.cluster.eventSequence || []).join(' → ')}</span></div>
            <div>Confidence: {(skill.cluster.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      {/* Graph editor fills remaining space */}
      <div className="flex-1 min-h-[400px]">
        <SkillGraphEditor
          nodes={(latestVersion?.nodes as any[]) || []}
          edges={(latestVersion?.edges as any[]) || []}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
        />
      </div>
    </div>
  );
}
