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
  isSessionExpired: boolean;
  expiresAt: string | null;
  login: (user: User, expiresAt?: string | null) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setInitialized: (val: boolean) => void;
  setSessionExpired: (val: boolean) => void;
  getIsAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null as User | null,
      isAuthenticated: false,
      initialized: false,
      isSessionExpired: false,
      expiresAt: null as string | null,
      login: (user: User, expiresAt: string | null = null) => {
        set({ user, isAuthenticated: true, expiresAt, isSessionExpired: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, expiresAt: null });
      },
      completeOnboarding: () => 
        set((state) => ({
          user: state.user ? { ...state.user, onboarded: true } : null
        })),
      setInitialized: (val: boolean) => set({ initialized: val }),
      setSessionExpired: (val: boolean) => set({ isSessionExpired: val }),
      getIsAuthenticated: () => get().isAuthenticated,
    }),
    {
      name: 'quiz-platform-auth',
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.setInitialized(true);
            // Ensure isAuthenticated is synced with user existence after rehydration
            if (state.user && !state.isAuthenticated) {
                state.login(state.user, state.expiresAt);
            }
        }
      }
    }
  )
);
