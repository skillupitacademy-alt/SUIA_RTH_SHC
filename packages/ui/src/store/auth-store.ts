import { create } from 'zustand';

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
  isAccessDenied: boolean;
  expiresAt: string | null;
  isLocked: boolean;
  isLoggingOut: boolean;
  
  login: (user: AuthUser, expiresAt?: string | null) => void;
  logout: (onLogout?: () => void) => void;
  lock: () => void;
  unlock: () => void;
  setInitialized: (val: boolean) => void;
  setSessionExpired: (val: boolean) => void;
  setAccessDenied: (val: boolean) => void;
  setLoggingOut: (val: boolean) => void;
  completeOnboarding: () => void;
}

interface CreateAuthStoreOptions {
  onLogout?: () => void;
}

export const createAuthStore = (options: CreateAuthStoreOptions) => {
  return create<AuthState>()((set) => ({
    user: null,
    isAuthenticated: false,
    initialized: true,
    isSessionExpired: false,
    isAccessDenied: false,
    isLocked: false,
    isLoggingOut: false,
    expiresAt: null,
    login: (user, expiresAt = null) => {
      set({
        user,
        isAuthenticated: true,
        expiresAt,
        isSessionExpired: false,
        isAccessDenied: false,
        isLocked: false,
        isLoggingOut: false,
      });
    },
    logout: (onLogout) => {
      if (onLogout) onLogout();
      if (options.onLogout) options.onLogout();

      set({
        user: null,
        isAuthenticated: false,
        expiresAt: null,
        isSessionExpired: false,
        isAccessDenied: false,
        isLocked: false,
        isLoggingOut: false,
      });
    },
    lock: () => set({ isLocked: true }),
    unlock: () => set({ isLocked: false }),
    setInitialized: (val) => set({ initialized: val }),
    setSessionExpired: (val) => set((state) => ({
      isSessionExpired: val,
      isAccessDenied: val ? false : state.isAccessDenied,
    })),
    setAccessDenied: (val) => set((state) => ({
      isAccessDenied: val,
      isSessionExpired: val ? false : state.isSessionExpired,
    })),
    setLoggingOut: (val) => set({ isLoggingOut: val }),
    completeOnboarding: () =>
      set((state) => ({
        user: state.user ? { ...state.user, onboarded: true } : null,
      })),
  }));
};
