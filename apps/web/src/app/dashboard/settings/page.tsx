'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Building2, UserPlus } from 'lucide-react';

const AVATAR_COLORS = ['#7c5cfc', '#e01e5a', '#2684ff', '#ff7a59', '#22c55e', '#f59e0b'];

export default function SettingsPage() {
  const { data: org, refetch: refetchOrg } = useApi<any>('/org');
  const { data: members, refetch: refetchMembers } = useApi<any[]>('/org/members');

  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org]);

  async function handleUpdateOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/org', { method: 'PATCH', body: { name: orgName } });
      await refetchOrg();
      toast.success('Organization updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await api('/org/members', { method: 'POST', body: { email: inviteEmail, role: inviteRole } });
      setInviteEmail('');
      await refetchMembers();
      toast.success('Member invited');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="p-10 space-y-10 max-w-2xl">

        {/* Organization */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization</h3>
          </div>
          <Card>
            <CardContent>
              <form onSubmit={handleUpdateOrg} className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="orgName" className="sr-only">Organization name</Label>
                  <Input id="orgName" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Team Members */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Members</h3>
          </div>

          <Card className="p-0 gap-0 overflow-hidden mb-4">
            {!members && (
              <div className="p-2 space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            )}
            {members?.map((member: any, i: number) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-3.5 border-b border-border/50 last:border-b-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    style={{
                      background: `color-mix(in srgb, ${AVATAR_COLORS[i % AVATAR_COLORS.length]} 15%, transparent)`,
                      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    }}
                    className="text-xs font-semibold"
                  >
                    {(member.name || member.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{member.name || member.email}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
                <Badge
                  variant={member.role === 'OWNER' ? 'accent' : member.role === 'ADMIN' ? 'info' : 'default'}
                >
                  {member.role}
                </Badge>
              </div>
            ))}
          </Card>

          <Card>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="inviteEmail" className="sr-only">Email address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={inviting}>
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : 'Invite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
