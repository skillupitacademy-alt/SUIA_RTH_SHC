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
  token: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setInitialized: (val: boolean) => void;
}

import { apiClient } from '@quiz/api-client';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      initialized: false,
      login: (user, token) => {
        apiClient.setAccessToken(token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        apiClient.setAccessToken(null);
        set({ user: null, token: null, isAuthenticated: false });
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
        if (state?.token) {
          apiClient.setAccessToken(state.token);
        }
        state?.setInitialized(true);
      }
    }
  )
);
