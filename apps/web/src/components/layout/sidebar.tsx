'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard, Plug, Activity, GitBranch, Cpu,
  Users, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/events', label: 'Events', icon: Activity },
  { href: '/dashboard/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/dashboard/skills', label: 'Skills', icon: Cpu },
  { href: '/dashboard/actors', label: 'Actors', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className="flex flex-col w-56 h-screen shrink-0 py-4 px-3"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <div className="px-3 mb-6">
        <h1 className="text-lg font-bold tracking-tight">Assemblr</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => { logout(); window.location.href = '/'; }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition hover:opacity-80"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </aside>
  );
}
