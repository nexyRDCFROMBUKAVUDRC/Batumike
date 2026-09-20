import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  background: string;
  text: string;
  card: string;
  border: string;
  textSecondary: string;
  accent: string;
  danger: string;
  navBackground: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  card: '#FFFFFF',
  border: '#000000',
  textSecondary: '#000000',
  accent: '#2563EB', // Bleu pour tous les boutons d'action
  danger: '#DC2626', // Rouge pour toutes les zones dangereuses
  navBackground: '#FFFFFF',
};

export const darkTheme: ThemeColors = {
  background: '#000000',
  text: '#FFFFFF',
  card: '#000000',
  border: '#FFFFFF',
  textSecondary: '#FFFFFF',
  accent: '#2563EB', // Bleu pour tous les boutons d'action
  danger: '#DC2626', // Rouge pour toutes les zones dangereuses
  navBackground: '#000000',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  mode: 'dark',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('nnecxy_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark'; // Default mobile social feed is sleek dark
  });

  useEffect(() => {
    try {
      localStorage.setItem('nnecxy_theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#FFFFFF';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        document.body.style.backgroundColor = '#FFFFFF';
        document.body.style.color = '#000000';
      }
    } catch {
      // ignore
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
  };

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark: mode === 'dark',
        mode,
        toggleTheme,
        setThemeMode,
      }}
    >
      <div
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          minHeight: '100vh',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
