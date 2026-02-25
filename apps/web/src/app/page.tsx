'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthPage() {
  const router = useRouter();
  const { signup, signin, selectOrg } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<any[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email, password, name, orgName);
        router.push('/dashboard');
      } else {
        const memberships = await signin(email, password);
        if (memberships.length === 1) {
          await selectOrg(memberships[0].orgId);
          router.push('/dashboard');
        } else {
          setOrgs(memberships);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleOrgSelect(orgId: string) {
    setLoading(true);
    try {
      await selectOrg(orgId);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (orgs) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm space-y-6 p-8 rounded-xl" style={{ border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-semibold text-center">Select Organization</h1>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="space-y-2">
            {orgs.map((org) => (
              <button
                key={org.orgId}
                onClick={() => handleOrgSelect(org.orgId)}
                disabled={loading}
                className="w-full p-3 text-left rounded-lg hover:opacity-80 transition"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div className="font-medium">{org.orgName}</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{org.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm space-y-6 p-8 rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Assemblr</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <input
                type="text" placeholder="Your name" value={name}
                onChange={(e) => setName(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              />
              <input
                type="text" placeholder="Organization name" value={orgName}
                onChange={(e) => setOrgName(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              />
            </>
          )}
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={8}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="underline font-medium" style={{ color: 'var(--foreground)' }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
