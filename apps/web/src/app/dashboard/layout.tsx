'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { api } from '@/lib/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const token = localStorage.getItem('assemblr_token');
    if (!token) {
      router.push('/');
      return;
    }

    const dismissed = localStorage.getItem('assemblr_onboarding_dismissed');
    if (!dismissed && !pathname.startsWith('/dashboard/onboarding')) {
      api<any[]>('/integrations')
        .then((integrations) => {
          const connected = integrations?.filter((i) => i.status === 'CONNECTED').length || 0;
          if (connected === 0) {
            router.push('/dashboard/onboarding');
          }
          setReady(true);
        })
        .catch(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [isAuthenticated, router, pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[--bg-elevated]">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
