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
  token: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
}

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
      setInitialized: (val) => set({ initialized: val }),
    }),
    {
      name: 'quiz-platform-admin-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setAccessToken(state.token);
        }
        state?.setInitialized(true);
      },
    }
  )
);
