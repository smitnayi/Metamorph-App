import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>((set) => {
  // Initialize from local storage or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = savedTheme ? savedTheme === 'dark' : systemDark;

  if (initialDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    isDark: initialDark,
    toggleTheme: () => {
      set((state) => {
        const newDark = !state.isDark;
        if (newDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
        return { isDark: newDark };
      });
    },
  };
});
