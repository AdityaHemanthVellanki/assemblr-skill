'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard, Plug, Activity, GitBranch, Cpu,
  Users, Settings, LogOut, Sparkles,
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
      className="flex flex-col w-[220px] h-screen shrink-0 py-5 px-3"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #6d4de8)',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
        >
          <Sparkles size={16} color="#fff" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>
          Assemblr
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150"
              style={{
                background: active ? 'var(--sidebar-active)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--fg-muted)',
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              {label}
              {active && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
        <button
          onClick={() => { logout(); window.location.href = '/'; }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 w-full"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
