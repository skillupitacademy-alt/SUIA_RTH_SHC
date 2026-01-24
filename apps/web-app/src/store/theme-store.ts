import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'theme-a' | 'theme-b';
type Mode = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
  toggleTheme: () => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'theme-a',
      mode: 'light',
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'theme-a' ? 'theme-b' : 'theme-a' })),
      toggleMode: () =>
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'quiz-platform-theme',
      onRehydrateStorage: () => (state) => {
        // Handle system preference if nothing is stored
        if (state && !localStorage.getItem('quiz-platform-theme')) {
           const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
           state.setMode(isDark ? 'dark' : 'light');
        }
      }
    }
  )
);
