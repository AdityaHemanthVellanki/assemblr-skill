'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard, Plug, Activity, GitBranch, Cpu,
  Users, Settings, LogOut, Sparkles, ChevronsLeft, ChevronsRight,
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
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 72 : 260;

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-screen shrink-0 py-6 px-3 relative overflow-hidden bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-gradient-to-br from-[--accent-brand] to-[--accent-brand-hover] shadow-[0_0_16px_var(--accent-glow)]">
          <Sparkles size={17} color="#fff" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-[15px] font-semibold whitespace-nowrap text-foreground tracking-tight"
            >
              Assemblr
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

          const navContent = (
            <motion.div
              className="flex items-center gap-3 rounded-lg text-sm relative overflow-hidden"
              style={{
                padding: collapsed ? '10px 12px' : '10px 14px',
              }}
              data-active={active}
              whileHover={{ backgroundColor: active ? 'var(--sidebar-accent)' : 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.5}
                className={`shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`whitespace-nowrap ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link href={href} className="block">{navContent}</Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={href} href={href} className="block">{navContent}</Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t border-sidebar-border pt-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={() => setCollapsed(!collapsed)}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /><span>Collapse</span></>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Expand sidebar</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={() => { logout(); window.location.href = '/'; }}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut size={18} strokeWidth={1.5} />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sign out</TooltipContent>}
        </Tooltip>
      </div>
    </motion.aside>
  );
}
