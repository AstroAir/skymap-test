'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  card: string;
  border: string;
  destructive: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    light: Partial<ThemeColors>;
    dark: Partial<ThemeColors>;
  };
}

export interface ThemeCustomization {
  radius: number;
  fontFamily: 'default' | 'serif' | 'mono' | 'system';
  fontSize: 'small' | 'default' | 'large';
  animationsEnabled: boolean;
  activePreset: string | null;
  customColors: {
    light: Partial<ThemeColors>;
    dark: Partial<ThemeColors>;
  };
}

interface ThemeStore {
  customization: ThemeCustomization;
  setRadius: (radius: number) => void;
  setFontFamily: (font: ThemeCustomization['fontFamily']) => void;
  setFontSize: (size: ThemeCustomization['fontSize']) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setActivePreset: (presetId: string | null) => void;
  setCustomColor: (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => void;
  resetCustomization: () => void;
  applyCustomization: () => void;
}

const defaultCustomization: ThemeCustomization = {
  radius: 0.5,
  fontFamily: 'default',
  fontSize: 'default',
  animationsEnabled: true,
  activePreset: null,
  customColors: {
    light: {},
    dark: {},
  },
};

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      light: {
        primary: 'oklch(0.4815 0.1178 263.3758)',
        secondary: 'oklch(0.8567 0.1164 81.0092)',
        accent: 'oklch(0.6896 0.0714 234.0387)',
      },
      dark: {
        primary: 'oklch(0.4815 0.1178 263.3758)',
        secondary: 'oklch(0.9097 0.1440 95.1120)',
        accent: 'oklch(0.8469 0.0524 264.7751)',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      light: {
        primary: 'oklch(0.45 0.15 220)',
        secondary: 'oklch(0.75 0.12 200)',
        accent: 'oklch(0.60 0.18 180)',
      },
      dark: {
        primary: 'oklch(0.55 0.18 220)',
        secondary: 'oklch(0.70 0.15 200)',
        accent: 'oklch(0.65 0.20 180)',
      },
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      light: {
        primary: 'oklch(0.45 0.12 145)',
        secondary: 'oklch(0.70 0.10 130)',
        accent: 'oklch(0.55 0.15 160)',
      },
      dark: {
        primary: 'oklch(0.55 0.15 145)',
        secondary: 'oklch(0.65 0.12 130)',
        accent: 'oklch(0.60 0.18 160)',
      },
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      light: {
        primary: 'oklch(0.55 0.18 30)',
        secondary: 'oklch(0.75 0.15 50)',
        accent: 'oklch(0.65 0.20 15)',
      },
      dark: {
        primary: 'oklch(0.60 0.20 30)',
        secondary: 'oklch(0.70 0.18 50)',
        accent: 'oklch(0.65 0.22 15)',
      },
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      light: {
        primary: 'oklch(0.55 0.15 300)',
        secondary: 'oklch(0.80 0.10 290)',
        accent: 'oklch(0.65 0.18 320)',
      },
      dark: {
        primary: 'oklch(0.60 0.18 300)',
        secondary: 'oklch(0.75 0.12 290)',
        accent: 'oklch(0.70 0.20 320)',
      },
    },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    colors: {
      light: {
        primary: 'oklch(0.40 0.20 280)',
        secondary: 'oklch(0.70 0.15 260)',
        accent: 'oklch(0.55 0.25 300)',
      },
      dark: {
        primary: 'oklch(0.50 0.25 280)',
        secondary: 'oklch(0.65 0.18 260)',
        accent: 'oklch(0.60 0.28 300)',
      },
    },
  },
];

const fontFamilyMap: Record<ThemeCustomization['fontFamily'], string> = {
  default: 'Libre Baskerville, serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const fontSizeScale: Record<ThemeCustomization['fontSize'], number> = {
  small: 0.875,
  default: 1,
  large: 1.125,
};

// Batch DOM updates for better performance
let pendingUpdate: number | null = null;

function applyThemeToDOM(customization: ThemeCustomization) {
  // Cancel any pending update
  if (pendingUpdate !== null) {
    cancelAnimationFrame(pendingUpdate);
  }

  // Batch DOM updates in a single animation frame
  pendingUpdate = requestAnimationFrame(() => {
    pendingUpdate = null;
    const root = document.documentElement;

    // Collect all style changes
    const styleUpdates: [string, string][] = [];

    // Apply radius
    styleUpdates.push(['--radius', `${customization.radius}rem`]);

    // Apply font family
    styleUpdates.push(['--font-sans', fontFamilyMap[customization.fontFamily]]);

    // Apply font size
    styleUpdates.push(['--font-size-scale', String(fontSizeScale[customization.fontSize])]);

    // Clear all previous color inline styles before applying new ones
    const allColorKeys: (keyof ThemeColors)[] = [
      'primary', 'secondary', 'accent', 'background',
      'foreground', 'muted', 'card', 'border', 'destructive',
    ];
    allColorKeys.forEach(key => {
      root.style.removeProperty(`--${key}`);
    });

    // Apply custom colors based on current theme
    const isDark = root.classList.contains('dark');
    const colors = isDark ? customization.customColors.dark : customization.customColors.light;

    // Find active preset colors
    const activePreset = themePresets.find(p => p.id === customization.activePreset);
    const presetColors = activePreset
      ? (isDark ? activePreset.colors.dark : activePreset.colors.light)
      : {};

    // Merge preset and custom colors
    const mergedColors = { ...presetColors, ...colors };

    Object.entries(mergedColors).forEach(([key, value]) => {
      if (value) {
        styleUpdates.push([`--${key}`, value]);
      }
    });

    // Apply all style updates at once
    styleUpdates.forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });

    // Update font size on root
    root.style.fontSize = `${fontSizeScale[customization.fontSize] * 16}px`;

    // Apply animations class
    if (!customization.animationsEnabled) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  });
}

/**
 * Get the CSS font-family string for a given font family option.
 */
export function getFontPreview(font: ThemeCustomization['fontFamily']): string {
  return fontFamilyMap[font];
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      customization: defaultCustomization,
      
      setRadius: (radius) => {
        set((state) => ({
          customization: { ...state.customization, radius },
        }));
        get().applyCustomization();
      },
      
      setFontFamily: (fontFamily) => {
        set((state) => ({
          customization: { ...state.customization, fontFamily },
        }));
        get().applyCustomization();
      },
      
      setFontSize: (fontSize) => {
        set((state) => ({
          customization: { ...state.customization, fontSize },
        }));
        get().applyCustomization();
      },
      
      setAnimationsEnabled: (animationsEnabled) => {
        set((state) => ({
          customization: { ...state.customization, animationsEnabled },
        }));
        get().applyCustomization();
      },
      
      setActivePreset: (activePreset) => {
        set((state) => ({
          customization: { ...state.customization, activePreset },
        }));
        get().applyCustomization();
      },
      
      setCustomColor: (mode, key, value) => {
        set((state) => ({
          customization: {
            ...state.customization,
            customColors: {
              ...state.customization.customColors,
              [mode]: {
                ...state.customization.customColors[mode],
                [key]: value,
              },
            },
          },
        }));
        get().applyCustomization();
      },
      
      resetCustomization: () => {
        set({ customization: defaultCustomization });
        // Reset CSS variables
        const root = document.documentElement;
        root.style.removeProperty('--radius');
        root.style.removeProperty('--font-sans');
        root.style.removeProperty('--font-size-scale');
        root.style.fontSize = '';
        root.classList.remove('reduce-motion');
        ['primary', 'secondary', 'accent', 'background', 'foreground', 'muted', 'card', 'border', 'destructive'].forEach(key => {
          root.style.removeProperty(`--${key}`);
        });
      },
      
      applyCustomization: () => {
        if (typeof window !== 'undefined') {
          applyThemeToDOM(get().customization);
        }
      },
    }),
    {
      name: 'theme-customization',
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.applyCustomization(), 0);
        }
      },
    }
  )
);
