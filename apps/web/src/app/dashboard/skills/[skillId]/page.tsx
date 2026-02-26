'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { SkillGraphEditor } from '@/components/graph/skill-graph-editor';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Plus, Download, Trash2, Save, Loader2, Layers, Target, ArrowRight } from 'lucide-react';

export default function SkillDetailPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const router = useRouter();
  const { data: skill, refetch } = useApi<any>(`/skills/${skillId}`);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const latestVersion = skill?.versions?.[0];

  async function handleSave() {
    setSaving(true);
    try {
      await api(`/skills/${skillId}`, { method: 'PATCH', body: { name, description } });
      setEditing(false);
      await refetch();
      toast.success('Skill updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleNewVersion() {
    try {
      await api(`/skills/${skillId}/version`, { method: 'POST' });
      await refetch();
      toast.success('New version created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create version');
    }
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
    toast.success('Skill exported');
  }

  async function handleDelete() {
    try {
      await api(`/skills/${skillId}`, { method: 'DELETE' });
      toast.success('Skill deleted');
      router.push('/dashboard/skills');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  }

  async function handleNodesChange(nodes: any[]) {
    if (!latestVersion) return;
    await api(`/skills/${skillId}/nodes`, { method: 'PUT', body: { nodes, versionId: latestVersion.id } });
  }

  async function handleEdgesChange(edges: any[]) {
    if (!latestVersion) return;
    await api(`/skills/${skillId}/edges`, { method: 'PUT', body: { edges, versionId: latestVersion.id } });
  }

  if (!skill) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Skill" />
        <div className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-up">
      <PageHeader title={skill.name}>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setName(skill.name); setDescription(skill.description || ''); setEditing(true); }}
              >
                <Pencil size={13} /> Edit
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit skill name and description</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={handleNewVersion}>
                <Plus size={13} /> New Version
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new version of this skill</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download size={13} /> Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download skill as JSON</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon-sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete skill</TooltipContent>
          </Tooltip>
        </div>
      </PageHeader>

      <div className="px-10 py-6 shrink-0 space-y-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Badge variant={skill.status === 'ACTIVE' ? 'success' : 'default'} dot>
            {skill.status}
          </Badge>
          <Badge variant="default">
            <Layers size={11} /> v{latestVersion?.version || 1}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {skill.versions?.length || 0} versions
          </span>
        </div>

        {skill.cluster && (
          <Card className="flex-row items-center gap-6 text-xs px-4 py-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target size={12} className="text-primary" />
              <span className="font-mono">{skill.cluster.anchorEventType}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowRight size={12} />
              <span className="font-mono">{(skill.cluster.eventSequence || []).join(' → ')}</span>
            </div>
            <Badge variant="accent" className="ml-auto">
              {(skill.cluster.confidenceScore * 100).toFixed(0)}% confidence
            </Badge>
          </Card>
        )}
      </div>

      <div className="flex-1 min-h-[400px]">
        <SkillGraphEditor
          nodes={(latestVersion?.nodes as any[]) || []}
          edges={(latestVersion?.edges as any[]) || []}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
        />
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Skill"
        description="This will permanently delete this skill and all its versions. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
