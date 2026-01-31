/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useThemeStore, themePresets } from '../theme-store';

describe('useThemeStore', () => {
  // Mock requestAnimationFrame to execute callbacks synchronously
  const originalRAF = global.requestAnimationFrame;
  const originalCAF = global.cancelAnimationFrame;

  beforeAll(() => {
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    global.cancelAnimationFrame = jest.fn();
  });

  afterAll(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
  });

  beforeEach(() => {
    // Reset store to defaults before each test
    act(() => {
      useThemeStore.getState().resetCustomization();
    });
  });

  describe('initial state', () => {
    it('should have default customization values', () => {
      const state = useThemeStore.getState();
      
      expect(state.customization.radius).toBe(0.5);
      expect(state.customization.fontFamily).toBe('default');
      expect(state.customization.fontSize).toBe('default');
      expect(state.customization.animationsEnabled).toBe(true);
      expect(state.customization.activePreset).toBeNull();
    });

    it('should have empty custom colors', () => {
      const state = useThemeStore.getState();
      
      expect(state.customization.customColors.light).toEqual({});
      expect(state.customization.customColors.dark).toEqual({});
    });
  });

  describe('setRadius', () => {
    it('should update radius', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setRadius(0.75);
      });
      
      expect(result.current.customization.radius).toBe(0.75);
    });

    it('should apply customization to DOM', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setRadius(1.0);
      });
      
      expect(document.documentElement.style.getPropertyValue('--radius')).toBe('1rem');
    });
  });

  describe('setFontFamily', () => {
    it('should update font family', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setFontFamily('mono');
      });
      
      expect(result.current.customization.fontFamily).toBe('mono');
    });

    it('should apply font family to DOM', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setFontFamily('system');
      });
      
      expect(document.documentElement.style.getPropertyValue('--font-sans')).toContain('system-ui');
    });
  });

  describe('setFontSize', () => {
    it('should update font size', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setFontSize('large');
      });
      
      expect(result.current.customization.fontSize).toBe('large');
    });

    it('should apply font size scale to DOM', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setFontSize('small');
      });
      
      expect(document.documentElement.style.getPropertyValue('--font-size-scale')).toBe('0.875');
    });
  });

  describe('setAnimationsEnabled', () => {
    it('should update animations enabled', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setAnimationsEnabled(false);
      });
      
      expect(result.current.customization.animationsEnabled).toBe(false);
    });

    it('should add reduce-motion class when disabled', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setAnimationsEnabled(false);
      });
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    });

    it('should remove reduce-motion class when enabled', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setAnimationsEnabled(false);
        result.current.setAnimationsEnabled(true);
      });
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
    });
  });

  describe('setActivePreset', () => {
    it('should update active preset', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setActivePreset('ocean');
      });
      
      expect(result.current.customization.activePreset).toBe('ocean');
    });

    it('should clear active preset with null', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setActivePreset('ocean');
        result.current.setActivePreset(null);
      });
      
      expect(result.current.customization.activePreset).toBeNull();
    });
  });

  describe('setCustomColor', () => {
    it('should set custom light color', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setCustomColor('light', 'primary', '#ff0000');
      });
      
      expect(result.current.customization.customColors.light.primary).toBe('#ff0000');
    });

    it('should set custom dark color', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setCustomColor('dark', 'accent', '#00ff00');
      });
      
      expect(result.current.customization.customColors.dark.accent).toBe('#00ff00');
    });

    it('should preserve existing colors', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setCustomColor('light', 'primary', '#ff0000');
        result.current.setCustomColor('light', 'secondary', '#00ff00');
      });
      
      expect(result.current.customization.customColors.light.primary).toBe('#ff0000');
      expect(result.current.customization.customColors.light.secondary).toBe('#00ff00');
    });
  });

  describe('resetCustomization', () => {
    it('should reset all customization to defaults', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setRadius(1.0);
        result.current.setFontFamily('mono');
        result.current.setFontSize('large');
        result.current.setAnimationsEnabled(false);
        result.current.setActivePreset('ocean');
        result.current.setCustomColor('light', 'primary', '#ff0000');
        result.current.resetCustomization();
      });
      
      expect(result.current.customization.radius).toBe(0.5);
      expect(result.current.customization.fontFamily).toBe('default');
      expect(result.current.customization.fontSize).toBe('default');
      expect(result.current.customization.animationsEnabled).toBe(true);
      expect(result.current.customization.activePreset).toBeNull();
      expect(result.current.customization.customColors.light).toEqual({});
    });

    it('should remove CSS variables from DOM', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setRadius(1.0);
        result.current.resetCustomization();
      });
      
      expect(document.documentElement.style.getPropertyValue('--radius')).toBe('');
    });
  });

  describe('applyCustomization', () => {
    it('should apply all settings to DOM', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setRadius(0.75);
        result.current.setFontFamily('serif');
        result.current.setFontSize('large');
      });
      
      // All should be applied
      expect(document.documentElement.style.getPropertyValue('--radius')).toBe('0.75rem');
      expect(document.documentElement.style.getPropertyValue('--font-sans')).toContain('serif');
    });
  });

  describe('themePresets', () => {
    it('should have multiple presets', () => {
      expect(themePresets.length).toBeGreaterThan(0);
    });

    it('should have required properties for each preset', () => {
      themePresets.forEach(preset => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.colors.light).toBeDefined();
        expect(preset.colors.dark).toBeDefined();
      });
    });

    it('should have default preset', () => {
      const defaultPreset = themePresets.find(p => p.id === 'default');
      expect(defaultPreset).toBeDefined();
    });

    it('should have various themed presets', () => {
      const presetIds = themePresets.map(p => p.id);
      
      expect(presetIds).toContain('ocean');
      expect(presetIds).toContain('forest');
      expect(presetIds).toContain('sunset');
      expect(presetIds).toContain('cosmos');
    });

    it('should have primary color in each preset', () => {
      themePresets.forEach(preset => {
        expect(preset.colors.light.primary || preset.colors.dark.primary).toBeDefined();
      });
    });
  });
});
