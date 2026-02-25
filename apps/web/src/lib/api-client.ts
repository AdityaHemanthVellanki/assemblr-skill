'use client';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('assemblr_token');
}

export function setToken(token: string) { localStorage.setItem('assemblr_token', token); }
export function clearToken() { localStorage.removeItem('assemblr_token'); }

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(err.message || 'Request failed', res.status, err.error);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
