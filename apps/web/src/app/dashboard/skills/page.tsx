'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { formatRelative } from '@/lib/utils';

export default function SkillsPage() {
  const { data } = useApi<any>('/skills');

  return (
    <div>
      <Header title="Skills" />
      <div className="p-6 space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Compiled skill graphs from detected workflow patterns.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!data?.data || data.data.length === 0) && (
            <div
              className="col-span-full p-8 text-center text-sm rounded-lg"
              style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              No skills compiled yet. Detect workflows first, then compile them into skills.
            </div>
          )}
          {data?.data?.map((skill: any) => (
            <Link
              key={skill.id}
              href={`/dashboard/skills/${skill.id}`}
              className="p-4 rounded-lg hover:opacity-80 transition block"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm truncate">{skill.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: skill.status === 'ACTIVE' ? '#dcfce7' : 'var(--muted)',
                    color: skill.status === 'ACTIVE' ? '#166534' : 'var(--muted-foreground)',
                  }}
                >
                  {skill.status}
                </span>
              </div>
              {skill.description && (
                <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                  {skill.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span>v{skill.versions?.[0]?.version || 1}</span>
                <span>{skill._count?.versions || 0} versions</span>
                <span>{formatRelative(skill.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
