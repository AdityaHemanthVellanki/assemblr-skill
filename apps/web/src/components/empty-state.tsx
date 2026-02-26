'use client';

import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary mb-4">
        <Icon size={22} />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      {action && (
        <Button variant="default" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
