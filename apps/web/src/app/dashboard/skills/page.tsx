'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useApi } from '@/hooks/use-api';
import { formatRelative } from '@/lib/utils';
import { Cpu, Layers, Clock, ArrowUpRight } from 'lucide-react';

export default function SkillsPage() {
  const { data } = useApi<any>('/skills');

  return (
    <div className="page-enter">
      <Header title="Skills" />
      <div className="p-8 space-y-5">
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          Compiled skill graphs from detected workflow patterns.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!data?.data || data.data.length === 0) && (
            <div
              className="col-span-full rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="empty-state">
                <div className="empty-icon">
                  <Cpu size={22} />
                </div>
                <div className="empty-title">No skills compiled</div>
                <div className="empty-description">
                  Detect workflows first, then compile them into executable skill graphs.
                </div>
              </div>
            </div>
          )}
          {data?.data?.map((skill: any) => (
            <Link
              key={skill.id}
              href={`/dashboard/skills/${skill.id}`}
              className="card card-interactive card-glow block"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                  >
                    <Cpu size={15} />
                  </div>
                  <span className="font-medium text-sm truncate" style={{ color: 'var(--fg)' }}>
                    {skill.name}
                  </span>
                </div>
                <span className={`badge badge-dot ${skill.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}`}>
                  {skill.status}
                </span>
              </div>

              {/* Description */}
              {skill.description && (
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  {skill.description}
                </p>
              )}

              {/* Footer */}
              <div
                className="flex items-center gap-3 text-[11px] pt-3"
                style={{ color: 'var(--fg-faint)', borderTop: '1px solid var(--border-subtle)' }}
              >
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  v{skill.versions?.[0]?.version || 1}
                </span>
                <span>{skill._count?.versions || 0} versions</span>
                <span className="flex items-center gap-1 ml-auto">
                  <Clock size={12} />
                  {formatRelative(skill.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
