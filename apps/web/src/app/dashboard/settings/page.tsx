'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';
import { Loader2, Building2, UserPlus, Check } from 'lucide-react';

export default function SettingsPage() {
  const { data: org, refetch: refetchOrg } = useApi<any>('/org');
  const { data: members, refetch: refetchMembers } = useApi<any[]>('/org/members');

  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org]);

  function showMessage(text: string, type: 'success' | 'error' = 'success') {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleUpdateOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/org', { method: 'PATCH', body: { name: orgName } });
      await refetchOrg();
      showMessage('Organization updated');
    } catch (err: any) {
      showMessage(err.message, 'error');
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
      showMessage('Member invited');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setInviting(false);
    }
  }

  const AVATAR_COLORS = ['#7c5cfc', '#e01e5a', '#2684ff', '#ff7a59', '#22c55e', '#f59e0b'];

  return (
    <div className="page-enter">
      <Header title="Settings" />
      <div className="p-8 space-y-8 max-w-2xl">
        {/* Toast message */}
        {message && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-slide-down"
            style={{
              background: messageType === 'success' ? 'var(--success-muted)' : 'var(--error-muted)',
              color: messageType === 'success' ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${messageType === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {messageType === 'success' && <Check size={16} />}
            {message}
          </div>
        )}

        {/* Org settings */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
            <h3 className="section-title">Organization</h3>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <form onSubmit={handleUpdateOrg} className="flex gap-3">
              <input
                type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                className="input flex-1"
                placeholder="Organization name"
              />
              <button
                type="submit" disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
              </button>
            </form>
          </div>
        </section>

        {/* Members */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={14} style={{ color: 'var(--fg-muted)' }} />
            <h3 className="section-title">Team Members</h3>
          </div>

          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {members?.map((member: any, i: number) => (
              <div
                key={member.id}
                className="list-row"
              >
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: `color-mix(in srgb, ${AVATAR_COLORS[i % AVATAR_COLORS.length]} 15%, transparent)`,
                    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  }}
                >
                  {(member.name || member.email || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'var(--fg)' }}>
                    {member.name || member.email}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{member.email}</div>
                </div>
                <span className={`badge ${member.role === 'OWNER' ? 'badge-accent' : member.role === 'ADMIN' ? 'badge-info' : 'badge-default'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email" placeholder="Email address" value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)} required
                className="input flex-1"
              />
              <select
                value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                className="input"
                style={{ width: 120, flex: 'none' }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit" disabled={inviting}
                className="btn btn-primary"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : 'Invite'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
