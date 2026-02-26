'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { user } = useAuthStore();
  const initials = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <header className="h-[--header-height] flex items-center justify-between px-10 border-b border-border shrink-0 relative">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-8 w-8 cursor-default">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">
              <div className="font-medium">{user?.name || 'User'}</div>
              {user?.email && <div className="text-muted-foreground">{user.email}</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      {/* Accent glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-40"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-brand), transparent)' }}
      />
    </header>
  );
}
