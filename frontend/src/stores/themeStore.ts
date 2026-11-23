import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('cybersentinel_theme') as Theme | null;
  if (saved === 'dark' || saved === 'light') return saved;
  // Default to dark theme for enterprise SOC
  return 'dark';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('cybersentinel_theme', nextTheme);
        const root = document.documentElement;
        if (nextTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    });
  },
  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cybersentinel_theme', theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    set({ theme });
  },
}));
