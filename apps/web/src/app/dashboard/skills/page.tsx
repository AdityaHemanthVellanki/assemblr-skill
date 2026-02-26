'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/page-header';
import { useApi } from '@/hooks/use-api';
import { formatRelative } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container';
import { EmptyState } from '@/components/empty-state';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, Layers, Clock } from 'lucide-react';

export default function SkillsPage() {
  const { data } = useApi<any>('/skills');

  return (
    <div>
      <PageHeader title="Skills" />
      <div className="p-10 space-y-5">
        <p className="text-sm text-muted-foreground">
          Compiled skill graphs from detected workflow patterns.
        </p>

        {!data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 gap-0 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
        )}

        {data && (!data.data || data.data.length === 0) && (
          <Card className="p-0">
            <EmptyState
              icon={Cpu}
              title="No skills compiled"
              description="Detect workflows first, then compile them into executable skill graphs."
            />
          </Card>
        )}

        {data?.data?.length > 0 && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((skill: any) => (
              <StaggerItem key={skill.id}>
                <Link href={`/dashboard/skills/${skill.id}`} className="block no-underline text-inherit">
                  <motion.div
                    whileHover={{ y: -2, boxShadow: '0 0 0 1px var(--accent-brand-muted), 0 8px 30px rgba(0,0,0,0.3)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-6 gap-0 cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                            <Cpu size={16} />
                          </div>
                          <span className="font-medium text-sm truncate text-foreground">{skill.name}</span>
                        </div>
                        <Badge variant={skill.status === 'ACTIVE' ? 'success' : 'default'} dot>
                          {skill.status}
                        </Badge>
                      </div>
                      {skill.description && (
                        <p className="text-xs mb-3 line-clamp-2 text-muted-foreground leading-relaxed">{skill.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] pt-3 text-muted-foreground/60 border-t border-border/50">
                        <span className="flex items-center gap-1"><Layers size={12} /> v{skill.versions?.[0]?.version || 1}</span>
                        <span>{skill._count?.versions || 0} versions</span>
                        <span className="flex items-center gap-1 ml-auto"><Clock size={12} /> {formatRelative(skill.updatedAt)}</span>
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
