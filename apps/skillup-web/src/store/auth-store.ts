import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
  onboarded?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
  isSessionExpired: boolean;
  expiresAt: string | null;
  isLocked: boolean;
  isLoggingOut: boolean;
  login: (user: AuthUser, expiresAt?: string | null) => void;
  logout: (onLogout?: () => void) => void;
  lock: () => void;
  unlock: () => void;
  setInitialized: (val: boolean) => void;
  setSessionExpired: (val: boolean) => void;
  setLoggingOut: (val: boolean) => void;
  completeOnboarding: () => void;
}

export const useSkillupAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      isSessionExpired: false,
      expiresAt: null,
      isLocked: false,
      isLoggingOut: false,
      login: (user, expiresAt = null) => {
        set({ user, isAuthenticated: true, expiresAt, isSessionExpired: false, isLocked: false, isLoggingOut: false });
      },
      logout: (onLogout) => {
        if (onLogout) onLogout();

        set({ user: null, isAuthenticated: false, expiresAt: null, isLocked: false, isLoggingOut: false });
      },
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setInitialized: (val) => set({ initialized: val }),
      setSessionExpired: (val) => set({ isSessionExpired: val }),
      setLoggingOut: (val) => set({ isLoggingOut: val }),
      completeOnboarding: () =>
        set((state) => ({
          user: state.user ? { ...state.user, onboarded: true } : null,
        })),
    }),
    {
      name: 'skillup-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized(true);

          if (state.user && !state.isAuthenticated) {
            state.login(state.user, state.expiresAt);
          }
        }
      },
    },
  ),
);
