import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  isSessionExpired: boolean;
  isLocked: boolean;
  isLoggingOut: boolean;
  expiresAt: string | null;
  login: (user: User, expiresAt?: string | null) => void;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
  setInitialized: (val: boolean) => void;
  setSessionExpired: (val: boolean) => void;
  setLoggingOut: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      isSessionExpired: false,
      isLocked: false,
      isLoggingOut: false,
      expiresAt: null,
      login: (user, expiresAt = null) => {
        set({ user, isAuthenticated: true, expiresAt, isLocked: false, isLoggingOut: false });
      },
      logout: () => {
        // SECURITY SHREDDER: Immediately purge sensitive draft data on logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('quiz-factory-storage-v1');
        }
        set({ user: null, isAuthenticated: false, expiresAt: null, isLocked: false, isLoggingOut: false });
      },
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setInitialized: (val) => set({ initialized: val }),
      setSessionExpired: (val) => set({ isSessionExpired: val }),
      setLoggingOut: (val) => set({ isLoggingOut: val }),
    }),
    {
      name: 'quiz-platform-admin-auth',
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
