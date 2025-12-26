import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getContrastText, darkenColor, lightenColor } from '../utils/colorUtils';

export interface ThemePreferences {
  darkMode: boolean;
  brightness: number; // 0-100
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  displayDensity: 'compact' | 'comfortable' | 'spacious';
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  language: string;
  dateFormat: string;
}

const defaultTheme: ThemePreferences = {
  darkMode: false,
  brightness: 100,
  primaryColor: '#007bff',
  accentColor: '#28a745',
  fontSize: 'medium',
  displayDensity: 'comfortable',
  notifications: {
    email: false,
    browser: true,
    sound: false,
  },
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
};

interface ThemeContextType {
  theme: ThemePreferences;
  updateTheme: (updates: Partial<ThemePreferences>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'imh_theme_preferences';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemePreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultTheme, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
    return defaultTheme;
  });

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    
    // Apply dark mode
    if (theme.darkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }

    // Calculate contrast-safe colors
    const primaryText = getContrastText(theme.primaryColor);
    const accentText = getContrastText(theme.accentColor);
    const primaryDark = darkenColor(theme.primaryColor, 15);
    const primaryLight = lightenColor(theme.primaryColor, 10);
    
    // For nav bar, use primary color or a darkened version for better contrast
    const navBackground = theme.darkMode 
      ? darkenColor(theme.primaryColor, 30) 
      : theme.primaryColor;
    const navText = getContrastText(navBackground);
    
    // Convert primary color to RGB for rgba() usage
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '59, 130, 246';
    };
    const primaryRgb = hexToRgb(theme.primaryColor);
    const primaryRgba = `rgba(${primaryRgb}, 0.1)`;

    // Apply CSS variables
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--primary-color-dark', primaryDark);
    root.style.setProperty('--primary-color-light', primaryLight);
    root.style.setProperty('--primary-text', primaryText);
    root.style.setProperty('--primary-color-rgb', primaryRgb);
    root.style.setProperty('--primary-color-rgba-light', primaryRgba);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-text', accentText);
    root.style.setProperty('--nav-background', navBackground);
    root.style.setProperty('--nav-text', navText);
    root.style.setProperty('--brightness', `${theme.brightness}%`);
    root.style.setProperty('--font-size', theme.fontSize);
    root.style.setProperty('--display-density', theme.displayDensity);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);

  const updateTheme = (updates: Partial<ThemePreferences>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

