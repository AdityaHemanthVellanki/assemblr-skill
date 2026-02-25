'use client';

import { useAuthStore } from '@/stores/auth.store';

export function Header({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className="flex items-center justify-between h-14 px-6 shrink-0"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {user?.email || user?.name || ''}
      </div>
    </header>
  );
}
