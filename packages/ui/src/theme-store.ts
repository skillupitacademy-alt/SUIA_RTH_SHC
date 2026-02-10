import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EnterpriseTheme = 'theme-a' | 'theme-b';

interface ThemeState {
  theme: EnterpriseTheme;
  setTheme: (theme: EnterpriseTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'theme-a',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ 
          theme: state.theme === 'theme-a' ? 'theme-b' : 'theme-a' 
        })),
    }),
    {
      name: 'quiz-platform-theme-state',
    }
  )
);
