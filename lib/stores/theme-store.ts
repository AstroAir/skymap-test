'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

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
  setCustomization: (customization: Partial<ThemeCustomization>) => void;
  setRadius: (radius: number) => void;
  setFontFamily: (font: ThemeCustomization['fontFamily']) => void;
  setFontSize: (size: ThemeCustomization['fontSize']) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setActivePreset: (presetId: string | null) => void;
  setCustomColor: (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => void;
  clearCustomColor: (mode: 'light' | 'dark', key: keyof ThemeColors) => void;
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

const fontFamilyOptions = ['default', 'serif', 'mono', 'system'] as const;
const fontSizeOptions = ['small', 'default', 'large'] as const;
const themeColorKeys: (keyof ThemeColors)[] = [
  'primary',
  'secondary',
  'accent',
  'background',
  'foreground',
  'muted',
  'card',
  'border',
  'destructive',
];

export const customizableThemeColorKeys = [...themeColorKeys] as const;

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

function hasOwn<T extends object>(obj: T, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function clampRadius(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sanitizeModeColors(value: unknown): Partial<ThemeColors> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const raw = value as Partial<Record<keyof ThemeColors, unknown>>;
  const next: Partial<ThemeColors> = {};

  for (const key of themeColorKeys) {
    const color = raw[key];
    if (typeof color === 'string' && color.trim()) {
      next[key] = color.trim();
    }
  }

  return next;
}

function sanitizeThemeCustomization(
  incoming: Partial<ThemeCustomization> | undefined,
  base: ThemeCustomization
): ThemeCustomization {
  const source = incoming ?? {};

  const radius = hasOwn(source, 'radius')
    ? (typeof source.radius === 'number' && Number.isFinite(source.radius)
      ? clampRadius(source.radius)
      : defaultCustomization.radius)
    : base.radius;

  const fontFamily = hasOwn(source, 'fontFamily')
    ? (fontFamilyOptions.includes(source.fontFamily as ThemeCustomization['fontFamily'])
      ? source.fontFamily as ThemeCustomization['fontFamily']
      : defaultCustomization.fontFamily)
    : base.fontFamily;

  const fontSize = hasOwn(source, 'fontSize')
    ? (fontSizeOptions.includes(source.fontSize as ThemeCustomization['fontSize'])
      ? source.fontSize as ThemeCustomization['fontSize']
      : defaultCustomization.fontSize)
    : base.fontSize;

  const animationsEnabled = hasOwn(source, 'animationsEnabled')
    ? (typeof source.animationsEnabled === 'boolean'
      ? source.animationsEnabled
      : defaultCustomization.animationsEnabled)
    : base.animationsEnabled;

  let activePreset = base.activePreset;
  if (hasOwn(source, 'activePreset')) {
    const preset = source.activePreset;
    if (preset === null) {
      activePreset = null;
    } else if (typeof preset === 'string' && themePresets.some((item) => item.id === preset)) {
      activePreset = preset;
    } else {
      activePreset = null;
    }
  }

  let lightColors = base.customColors.light;
  let darkColors = base.customColors.dark;

  if (hasOwn(source, 'customColors')) {
    const incomingColors = source.customColors;
    if (incomingColors && typeof incomingColors === 'object') {
      if (hasOwn(incomingColors, 'light')) {
        lightColors = sanitizeModeColors(incomingColors.light);
      }
      if (hasOwn(incomingColors, 'dark')) {
        darkColors = sanitizeModeColors(incomingColors.dark);
      }
    } else {
      lightColors = {};
      darkColors = {};
    }
  }

  return {
    radius,
    fontFamily,
    fontSize,
    animationsEnabled,
    activePreset,
    customColors: {
      light: lightColors,
      dark: darkColors,
    },
  };
}

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
    themeColorKeys.forEach(key => {
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

      setCustomization: (customization) => {
        set((state) => ({
          customization: sanitizeThemeCustomization(customization, state.customization),
        }));
        get().applyCustomization();
      },

      setRadius: (radius) => {
        get().setCustomization({ radius });
      },

      setFontFamily: (fontFamily) => {
        get().setCustomization({ fontFamily });
      },

      setFontSize: (fontSize) => {
        get().setCustomization({ fontSize });
      },

      setAnimationsEnabled: (animationsEnabled) => {
        get().setCustomization({ animationsEnabled });
      },

      setActivePreset: (activePreset) => {
        get().setCustomization({ activePreset });
      },

      setCustomColor: (mode, key, value) => {
        const current = get().customization;
        const modeColors = { ...current.customColors[mode], [key]: value };
        get().setCustomization({
          customColors: {
            ...current.customColors,
            [mode]: modeColors,
          },
        });
      },

      clearCustomColor: (mode, key) => {
        const current = get().customization;
        const modeColors = { ...current.customColors[mode] };
        delete modeColors[key];
        get().setCustomization({
          customColors: {
            ...current.customColors,
            [mode]: modeColors,
          },
        });
      },

      resetCustomization: () => {
        set({ customization: { ...defaultCustomization, customColors: { light: {}, dark: {} } } });
        // Reset CSS variables
        const root = document.documentElement;
        root.style.removeProperty('--radius');
        root.style.removeProperty('--font-sans');
        root.style.removeProperty('--font-size-scale');
        root.style.fontSize = '';
        root.classList.remove('reduce-motion');
        themeColorKeys.forEach(key => {
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
      storage: getZustandStorage(),
      version: 1,
      migrate: (persistedState) => {
        const raw = persistedState as { customization?: Partial<ThemeCustomization> } | Partial<ThemeCustomization> | undefined;
        const customization = raw && typeof raw === 'object' && hasOwn(raw, 'customization')
          ? (raw as { customization?: Partial<ThemeCustomization> }).customization
          : raw as Partial<ThemeCustomization> | undefined;

        return {
          customization: sanitizeThemeCustomization(customization, defaultCustomization),
        };
      },
      partialize: (state) => ({
        customization: state.customization,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.applyCustomization(), 0);
        }
      },
    }
  )
);
