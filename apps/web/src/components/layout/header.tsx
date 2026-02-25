'use client';

import { useAuthStore } from '@/stores/auth.store';

export function Header({ title, children }: { title: string; children?: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className="flex items-center justify-between h-16 px-8 shrink-0"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <div className="flex items-center gap-3">
          <div
            className="avatar avatar-sm"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-[13px]" style={{ color: 'var(--fg-secondary)' }}>
            {user?.name || user?.email || ''}
          </span>
        </div>
      </div>
    </header>
  );
}
