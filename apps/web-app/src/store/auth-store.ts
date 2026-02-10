import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  onboarded: boolean;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  expiresAt: string | null;
  login: (user: User, expiresAt?: string | null) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setInitialized: (val: boolean) => void;
}

import { apiClient } from '@quiz/api-client';

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
      completeOnboarding: () => 
        set((state) => ({
          user: state.user ? { ...state.user, onboarded: true } : null
        })),
      setInitialized: (val: boolean) => set({ initialized: val }),
    }),
    {
      name: 'quiz-platform-auth',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      }
    }
  )
);
