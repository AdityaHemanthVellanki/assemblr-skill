'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { api } from '@/lib/api-client';

export default function SettingsPage() {
  const { data: org, refetch: refetchOrg } = useApi<any>('/org');
  const { data: members, refetch: refetchMembers } = useApi<any[]>('/org/members');

  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org]);

  async function handleUpdateOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api('/org', { method: 'PATCH', body: { name: orgName } });
      await refetchOrg();
      setMessage('Organization updated');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage('');
    try {
      await api('/org/members', { method: 'POST', body: { email: inviteEmail, role: inviteRole } });
      setInviteEmail('');
      await refetchMembers();
      setMessage('Member invited');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-8 max-w-2xl">
        {message && (
          <div className="px-4 py-2 rounded text-sm" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            {message}
          </div>
        )}

        {/* Org settings */}
        <section>
          <h3 className="text-sm font-medium mb-3">Organization</h3>
          <form onSubmit={handleUpdateOrg} className="flex gap-3">
            <input
              type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            />
            <button
              type="submit" disabled={saving}
              className="px-4 py-2 rounded text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </section>

        {/* Members */}
        <section>
          <h3 className="text-sm font-medium mb-3">Members</h3>
          <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid var(--border)' }}>
            {members?.map((member: any, i: number) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
              >
                <div>
                  <div className="font-medium">{member.name || member.email}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{member.email}</div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--muted)' }}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email" placeholder="Email address" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)} required
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            />
            <select
              value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit" disabled={inviting}
              className="px-4 py-2 rounded text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
