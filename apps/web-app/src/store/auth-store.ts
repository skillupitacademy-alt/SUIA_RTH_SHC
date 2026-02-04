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
  login: (user: User) => void;
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
      login: (user) => {
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
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
