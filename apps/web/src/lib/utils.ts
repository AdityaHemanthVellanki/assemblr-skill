import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelative(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return formatDate(date);
}

export const SOURCE_LABELS: Record<string, string> = {
  SLACK: 'Slack', GITHUB: 'GitHub', HUBSPOT: 'HubSpot', JIRA: 'Jira',
  NOTION: 'Notion', GOOGLE: 'Google',
};

export const SOURCE_COLORS: Record<string, string> = {
  SLACK: '#e01e5a', GITHUB: '#8b5cf6', HUBSPOT: '#ff7a59', JIRA: '#2684ff',
  NOTION: '#f4f4f5', GOOGLE: '#4285f4',
};
