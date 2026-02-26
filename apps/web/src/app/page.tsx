'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
        router.push('/dashboard/onboarding');
      } else {
        const memberships = await signin(email, password);
        if (memberships.length === 1) {
          await selectOrg(memberships[0].orgId);
          const dismissed = localStorage.getItem('assemblr_onboarding_dismissed');
          router.push(dismissed ? '/dashboard' : '/dashboard/onboarding');
        } else {
          setOrgs(memberships);
          setLoading(false);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  }

  async function handleOrgSelect(orgId: string) {
    setLoading(true);
    setError('');
    try {
      await selectOrg(orgId);
      const dismissed = localStorage.getItem('assemblr_onboarding_dismissed');
      router.push(dismissed ? '/dashboard' : '/dashboard/onboarding');
    } catch (e: any) {
      setError(e.message || 'Failed to select organization');
      setLoading(false);
    }
  }

  // Org selection screen
  if (orgs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="w-full max-w-sm animate-scale-in relative z-10 px-6">
          <Card className="border-border shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-brand-hover))',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  <Sparkles size={18} color="#fff" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">
                  Select Organization
                </h1>
                <p className="text-sm mt-1 text-muted-foreground">
                  Choose a workspace to continue
                </p>
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: 'var(--error)' }}>
                  {error}
                </p>
              )}

              <div className="space-y-2">
                {orgs.map((org) => (
                  <button
                    key={org.orgId}
                    onClick={() => handleOrgSelect(org.orgId)}
                    disabled={loading}
                    className="w-full p-4 text-left rounded-xl transition-all duration-150 flex items-center justify-between group bg-card border border-border hover:border-primary hover:shadow-[0_0_0_1px_var(--accent-brand-muted)]"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        {org.orgName}
                      </div>
                      <div className="text-xs mt-0.5 text-muted-foreground">
                        {org.role}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Auth form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="w-full max-w-sm animate-scale-in relative z-10 px-6">
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 space-y-6">
            {/* Logo / Brand */}
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-brand-hover))',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Sparkles size={18} color="#fff" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">
                {mode === 'signin'
                  ? 'Sign in to your Assemblr workspace'
                  : 'Get started with Assemblr'}
              </p>
            </div>

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Inc."
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="glow"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight size={16} className="ml-2" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
