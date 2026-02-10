import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@quiz/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  expiresAt: string | null;
  login: (user: User, expiresAt?: string | null) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      expiresAt: null,
      login: (user, expiresAt = null) => {
        set({ user, isAuthenticated: true, expiresAt });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, expiresAt: null });
      },
      setInitialized: (val) => set({ initialized: val }),
    }),
    {
      name: 'quiz-platform-admin-auth',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
