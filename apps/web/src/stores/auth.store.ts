import { create } from 'zustand';
import { api, setToken, clearToken } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface OrgMembership {
  orgId: string;
  orgName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  memberships: OrgMembership[];
  currentOrg: { orgId: string; role: string } | null;
  isAuthenticated: boolean;

  signup: (email: string, password: string, name: string, orgName: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<OrgMembership[]>;
  selectOrg: (orgId: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  memberships: [],
  currentOrg: null,
  isAuthenticated: false,

  signup: async (email, password, name, orgName) => {
    const res = await api<any>('/auth/signup', { method: 'POST', body: { email, password, name, orgName } });
    setToken(res.token);
    set({
      user: res.user,
      currentOrg: { orgId: res.orgId, role: 'OWNER' },
      isAuthenticated: true,
    });
  },

  signin: async (email, password) => {
    const res = await api<any>('/auth/signin', { method: 'POST', body: { email, password } });
    set({ user: res.user, memberships: res.memberships });
    return res.memberships;
  },

  selectOrg: async (orgId) => {
    const res = await api<any>('/auth/select-org', { method: 'POST', body: { orgId } });
    setToken(res.token);
    set({
      currentOrg: { orgId: res.orgId, role: res.role },
      isAuthenticated: true,
    });
  },

  logout: () => {
    clearToken();
    set({ user: null, memberships: [], currentOrg: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('assemblr_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          currentOrg: { orgId: payload.orgId, role: payload.role },
          user: { id: payload.sub, email: '', name: null },
          isAuthenticated: true,
        });
      } catch {
        clearToken();
      }
    }
  },
}));
