'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SkillGraphEditor } from '@/components/graph/skill-graph-editor';
import { Pencil, Plus, Download, Trash2, X, Save, Loader2, Layers, Target, ArrowRight } from 'lucide-react';

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
      <div className="page-enter">
        <Header title="Skill" />
        <div className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-enter">
      <Header title={skill.name}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setName(skill.name); setDescription(skill.description || ''); setEditing(true); }}
            className="btn btn-secondary btn-sm"
          >
            <Pencil size={13} />
            Edit
          </button>
          <button onClick={handleNewVersion} className="btn btn-secondary btn-sm">
            <Plus size={13} />
            New Version
          </button>
          <button onClick={handleExport} className="btn btn-secondary btn-sm">
            <Download size={13} />
            Export
          </button>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 size={13} />
          </button>
        </div>
      </Header>

      <div className="px-8 py-5 shrink-0 space-y-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Status + version info */}
        <div className="flex items-center gap-3">
          <span className={`badge badge-dot ${skill.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}`}>
            {skill.status}
          </span>
          <span className="badge badge-default">
            <Layers size={11} />
            v{latestVersion?.version || 1}
          </span>
          <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            {skill.versions?.length || 0} versions
          </span>
        </div>

        {/* Edit form */}
        {editing && (
          <div
            className="p-4 rounded-xl animate-scale-in space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Skill name"
            />
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="input"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                <X size={14} />
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary btn-sm">
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
        )}

        {/* Cluster info */}
        {skill.cluster && (
          <div
            className="flex items-center gap-6 text-xs px-4 py-3 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
              <Target size={12} style={{ color: 'var(--accent)' }} />
              <span className="font-mono">{skill.cluster.anchorEventType}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
              <ArrowRight size={12} />
              <span className="font-mono">{(skill.cluster.eventSequence || []).join(' → ')}</span>
            </div>
            <span className="badge badge-accent ml-auto">
              {(skill.cluster.confidenceScore * 100).toFixed(0)}% confidence
            </span>
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
