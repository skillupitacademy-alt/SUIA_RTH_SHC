import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role: 'user' | 'admin' | 'super_admin' | 'infrastructure';
  onboarded?: boolean;
}

export interface AuthState {
  _user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  isLocked: boolean;
  isLoggingOut: boolean;
  expiresAt: string | null;
  login: (_user: User, expiresAt?: string | null) => void;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
  setInitialized: (val: boolean) => void;
  setIsLoggingOut: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      _user: null,
      isAuthenticated: false,
      initialized: false,
      isLocked: false,
      isLoggingOut: false,
      expiresAt: null,
      login: (_user, expiresAt = null) => {
        set({ _user, isAuthenticated: true, expiresAt, isLocked: false });
      },
      logout: () => {
        set({ _user: null, isAuthenticated: false, expiresAt: null, isLocked: false });
      },
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setInitialized: (val) => set({ initialized: val }),
      setIsLoggingOut: (val) => set({ isLoggingOut: val }),
    }),
    {
      name: 'quiz-platform-api-auth',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
