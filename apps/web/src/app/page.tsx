'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

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

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  }

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
      if (e.message?.includes('OAUTH_ACCOUNT') || e.message?.includes('Google sign-in')) {
        setError('This account uses Google sign-in. Click "Continue with Google" below.');
      } else {
        setError(e.message || 'Something went wrong');
      }
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

  // Org selection screen
  if (orgs) {
    return (
      <div className="flex min-h-screen items-center justify-center relative" style={{ background: 'var(--bg)' }}>
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="w-full max-w-sm animate-scale-in relative z-10">
          <div
            className="p-8 rounded-2xl space-y-6"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="text-center">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>Select Organization</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>Choose a workspace to continue</p>
            </div>
            {error && (
              <div className="px-4 py-2.5 rounded-lg text-sm" style={{ background: 'var(--error-muted)', color: 'var(--error)' }}>
                {error}
              </div>
            )}
            <div className="space-y-2">
              {orgs.map((org) => (
                <button
                  key={org.orgId}
                  onClick={() => handleOrgSelect(org.orgId)}
                  disabled={loading}
                  className="w-full p-4 text-left rounded-xl transition-all duration-150 flex items-center justify-between group"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--fg)' }}>{org.orgName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{org.role}</div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--fg-muted)' }} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative" style={{ background: 'var(--bg)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent-glow), transparent)' }}
        />
      </div>

      <div className="w-full max-w-[400px] animate-slide-up relative z-10 px-6">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #6d4de8)',
              boxShadow: 'var(--shadow-glow-lg)',
            }}
          >
            <Sparkles size={22} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--fg-muted)' }}>
            {mode === 'signin'
              ? 'Sign in to continue to Assemblr'
              : 'Get started with cross-tool workflow intelligence'}
          </p>
        </div>

        {/* Form Card */}
        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {error && (
            <div
              className="px-4 py-2.5 rounded-lg text-sm mb-5"
              style={{ background: 'var(--error-muted)', color: 'var(--error)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-secondary)' }}>Full name</label>
                  <input
                    type="text" placeholder="John Doe" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-secondary)' }}>Organization</label>
                  <input
                    type="text" placeholder="Acme Inc" value={orgName}
                    onChange={(e) => setOrgName(e.target.value)} required
                    className="input"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-secondary)' }}>Email</label>
              <input
                type="email" placeholder="you@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-secondary)' }}>Password</label>
              <input
                type="password" placeholder="Min. 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--fg-muted)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="font-medium transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
