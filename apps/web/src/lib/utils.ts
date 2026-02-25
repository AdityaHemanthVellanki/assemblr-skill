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
  NOTION: 'Notion', GOOGLE: 'Google Workspace', STRIPE: 'Stripe',
};

export const SOURCE_COLORS: Record<string, string> = {
  SLACK: '#4a154b', GITHUB: '#24292e', HUBSPOT: '#ff7a59', JIRA: '#0052cc',
  NOTION: '#000000', GOOGLE: '#4285f4', STRIPE: '#635bff',
};
