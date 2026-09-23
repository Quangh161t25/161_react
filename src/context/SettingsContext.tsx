import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserSettings,
  DEFAULT_SETTINGS,
  COLOR_CONFIG,
  FONT_CONFIG,
} from '../types/settings';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetDefaults: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'ui-storage';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state) {
          return { ...DEFAULT_SETTINGS, ...parsed.state };
        }
      }
    } catch {
      // fallback to defaults
    }
    return DEFAULT_SETTINGS;
  });

  // Apply theme and styles to DOM whenever settings change
  useEffect(() => {
    try {
      const el = document.documentElement;

      // 1. Color Scheme (dark / light / system)
      const isDark =
        settings.colorScheme === 'dark' ||
        (settings.colorScheme === 'system' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        el.classList.add('dark');
      } else {
        el.classList.remove('dark');
      }

      // 2. Primary Color
      const colorHsl = COLOR_CONFIG[settings.primaryColor]?.hsl || COLOR_CONFIG.blue.hsl;
      el.style.setProperty('--primary', colorHsl);
      el.style.setProperty('--ring', colorHsl);
      el.style.setProperty('--secondary-foreground', colorHsl);
      el.style.setProperty('--accent-foreground', colorHsl);
      el.style.setProperty('--color-primary', `hsl(${colorHsl})`);
      el.style.setProperty('--color-ring', `hsl(${colorHsl} / 0.5)`);

      // 3. Font Size
      el.dataset.textSize = settings.fontSize;
      if (settings.fontSize === 'small') {
        el.style.fontSize = '14px';
      } else if (settings.fontSize === 'large') {
        el.style.fontSize = '18px';
      } else {
        el.style.fontSize = '16px';
      }

      // 4. Font Family
      const font = settings.fontFamily;
      const fontParam = FONT_CONFIG[font]?.googleParam;
      if (fontParam) {
        const id = 'gfont-' + font.replace(/\s+/g, '-');
        if (!document.getElementById(id)) {
          const link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
          document.head.appendChild(link);
        }
      }
      const SANS_FALLBACK =
        "'Noto Sans', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
      const quotedFont = font.indexOf(' ') >= 0 ? `'${font}'` : font;
      el.style.setProperty('--font-sans', `${quotedFont}, ${SANS_FALLBACK}`);

      // 5. Persist to localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: settings,
          version: 1,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Helper: Format Currency according to settings
  const formatCurrency = (amount: number): string => {
    const isVi = settings.numberSeparator === 'vi';
    const parts = amount.toFixed(0).split('.');
    const integerPart = parts[0];
    const regex = /\B(?=(\d{3})+(?!\d))/g;
    const formattedNum = isVi
      ? integerPart.replace(regex, '.')
      : integerPart.replace(regex, ',');

    if (settings.currencyDisplay === 'symbol') {
      return `${formattedNum} ₫`;
    }
    if (settings.currencyDisplay === 'code') {
      return `${formattedNum} VND`;
    }
    return formattedNum;
  };

  // Helper: Format Date according to settings
  const formatDate = (dateInput: Date | string): string => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (settings.dateFormat === 'dd/mm/yyyy') {
      return `${day}/${month}/${year}`;
    }
    if (settings.dateFormat === 'mm/dd/yyyy') {
      return `${month}/${day}/${year}`;
    }
    return `${year}-${month}-${day}`;
  };

  // Helper: Format DateTime according to settings
  const formatDateTime = (dateInput: Date | string): string => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const formattedDate = formatDate(d);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (settings.timeFormat === '24h') {
      return `${formattedDate} ${String(hours).padStart(2, '0')}:${minutes}`;
    } else {
      const ampm = hours >= 12 ? 'CH' : 'SA';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${formattedDate} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetDefaults,
        formatCurrency,
        formatDate,
        formatDateTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
