'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { setToken } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectOrg } = useAuthStore();
  const [memberships, setMemberships] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const tempToken = searchParams.get('tempToken');
    const membershipsParam = searchParams.get('memberships');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
      return;
    }

    if (token) {
      // Final token issued (single org or new user)
      setToken(token);
      useAuthStore.setState({
        user: {
          id: searchParams.get('userId') || '',
          email: searchParams.get('email') || '',
          name: searchParams.get('name'),
        },
        currentOrg: {
          orgId: JSON.parse(atob(token.split('.')[1])).orgId,
          role: JSON.parse(atob(token.split('.')[1])).role,
        },
        isAuthenticated: true,
      });
      const dismissed = localStorage.getItem('assemblr_onboarding_dismissed');
      router.push(dismissed ? '/dashboard' : '/dashboard/onboarding');
      return;
    }

    if (tempToken && membershipsParam) {
      // Multi-org user — need org selection
      setToken(tempToken);
      const parsed = JSON.parse(membershipsParam);
      useAuthStore.setState({
        user: {
          id: searchParams.get('userId') || '',
          email: searchParams.get('email') || '',
          name: searchParams.get('name'),
        },
        memberships: parsed,
      });
      setMemberships(parsed);
      setLoading(false);
      return;
    }

    setError('Invalid callback. Please try signing in again.');
    setLoading(false);
  }, [searchParams, router]);

  async function handleOrgSelect(orgId: string) {
    setLoading(true);
    try {
      await selectOrg(orgId);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Signing you in...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
          <Button onClick={() => router.push('/')}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  // Org selection
  if (memberships) {
    return (
      <div className="flex min-h-screen items-center justify-center relative bg-background">
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
                <h1 className="text-xl font-semibold text-foreground">Select Organization</h1>
                <p className="text-sm mt-1 text-muted-foreground">Choose a workspace to continue</p>
              </div>
              <div className="space-y-2">
                {memberships.map((org: any) => (
                  <button
                    key={org.orgId}
                    onClick={() => handleOrgSelect(org.orgId)}
                    disabled={loading}
                    className="w-full p-4 text-left rounded-xl transition-all duration-150 flex items-center justify-between group border border-border hover:border-primary hover:shadow-[0_0_0_1px_var(--accent-brand-muted)]"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{org.orgName}</div>
                      <div className="text-xs mt-0.5 text-muted-foreground">{org.role}</div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
