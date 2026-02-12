import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
  onboarded?: boolean;
}

export interface AuthState {
  _user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  expiresAt: string | null;
  login: (_user: User, expiresAt?: string | null) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      _user: null,
      isAuthenticated: false,
      initialized: false,
      expiresAt: null,
      login: (_user, expiresAt = null) => {
        set({ _user, isAuthenticated: true, expiresAt });
      },
      logout: () => {
        set({ _user: null, isAuthenticated: false, expiresAt: null });
      },
      setInitialized: (val) => set({ initialized: val }),
    }),
    {
      name: 'quiz-platform-api-auth',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
