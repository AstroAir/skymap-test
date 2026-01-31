import { act, renderHook } from '@testing-library/react';
import {
  useNavigationHistoryStore,
  formatNavigationPoint,
  formatTimestamp,
  type NavigationPoint,
} from '../use-navigation-history';

// Mock zustand storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

describe('useNavigationHistoryStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useNavigationHistoryStore());
    act(() => {
      result.current.clear();
    });
  });

  describe('initial state', () => {
    it('should have empty history initially', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      expect(result.current.history).toEqual([]);
    });

    it('should have currentIndex at -1 initially', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      expect(result.current.currentIndex).toBe(-1);
    });

    it('should not be able to go back initially', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      expect(result.current.canGoBack()).toBe(false);
    });

    it('should not be able to go forward initially', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      expect(result.current.canGoForward()).toBe(false);
    });
  });

  describe('push', () => {
    it('should add a navigation point to history', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 180, dec: 45, fov: 60 });
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.history[0].ra).toBe(180);
      expect(result.current.history[0].dec).toBe(45);
    });

    it('should not add duplicate similar points', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 180, dec: 45, fov: 60 });
        result.current.push({ ra: 180.05, dec: 45.05, fov: 60.2 }); // Similar point
      });

      expect(result.current.history).toHaveLength(1);
    });

    it('should add different points', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 180, dec: 45, fov: 60 });
        result.current.push({ ra: 90, dec: -30, fov: 45 }); // Different point
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.currentIndex).toBe(1);
    });

    it('should handle RA wrap-around for similar points (0° ≈ 360°)', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 359.96, dec: 45, fov: 60 });
        result.current.push({ ra: 0.04, dec: 45, fov: 60 }); // Should be similar due to wrap-around (diff = 0.08 < 0.1)
      });

      expect(result.current.history).toHaveLength(1);
    });

    it('should truncate forward history when adding new point after going back', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
        result.current.push({ ra: 180, dec: 0, fov: 60 });
        result.current.back();
        result.current.push({ ra: 270, dec: 0, fov: 60 }); // New branch
      });

      expect(result.current.history).toHaveLength(3);
      expect(result.current.history[2].ra).toBe(270);
    });
  });

  describe('back', () => {
    it('should navigate back and return previous point', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
      });

      let backPoint: NavigationPoint | null;
      act(() => {
        backPoint = result.current.back();
      });

      expect(backPoint!.ra).toBe(0);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should return null when cannot go back', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
      });

      let backPoint: NavigationPoint | null;
      act(() => {
        backPoint = result.current.back();
      });

      expect(backPoint!).toBeNull();
    });
  });

  describe('forward', () => {
    it('should navigate forward and return next point', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
        result.current.back();
      });

      let forwardPoint: NavigationPoint | null;
      act(() => {
        forwardPoint = result.current.forward();
      });

      expect(forwardPoint!.ra).toBe(90);
      expect(result.current.currentIndex).toBe(1);
    });

    it('should return null when cannot go forward', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
      });

      let forwardPoint: NavigationPoint | null;
      act(() => {
        forwardPoint = result.current.forward();
      });

      expect(forwardPoint!).toBeNull();
    });
  });

  describe('goTo', () => {
    it('should navigate to specific index and return that point', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
        result.current.push({ ra: 180, dec: 0, fov: 60 });
      });

      let point: NavigationPoint | null;
      act(() => {
        point = result.current.goTo(1);
      });

      expect(point!.ra).toBe(90);
      expect(result.current.currentIndex).toBe(1);
    });

    it('should return null for invalid index (negative)', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
      });

      let point: NavigationPoint | null;
      act(() => {
        point = result.current.goTo(-1);
      });

      expect(point!).toBeNull();
      expect(result.current.currentIndex).toBe(0);
    });

    it('should return null for invalid index (out of bounds)', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
      });

      let point: NavigationPoint | null;
      act(() => {
        point = result.current.goTo(5);
      });

      expect(point!).toBeNull();
      expect(result.current.currentIndex).toBe(0);
    });

    it('should allow jumping to any valid index', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
        result.current.push({ ra: 180, dec: 0, fov: 60 });
        result.current.push({ ra: 270, dec: 0, fov: 60 });
      });

      // Jump from index 3 to index 0
      act(() => {
        result.current.goTo(0);
      });
      expect(result.current.currentIndex).toBe(0);

      // Jump from index 0 to index 2
      act(() => {
        result.current.goTo(2);
      });
      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe('canGoBack / canGoForward', () => {
    it('should correctly report navigation capabilities', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
      });
      expect(result.current.canGoBack()).toBe(false);
      expect(result.current.canGoForward()).toBe(false);

      act(() => {
        result.current.push({ ra: 90, dec: 0, fov: 60 });
      });
      expect(result.current.canGoBack()).toBe(true);
      expect(result.current.canGoForward()).toBe(false);

      act(() => {
        result.current.back();
      });
      expect(result.current.canGoBack()).toBe(false);
      expect(result.current.canGoForward()).toBe(true);
    });
  });

  describe('getCurrent', () => {
    it('should return current point', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 180, dec: 45, fov: 60 });
      });

      const current = result.current.getCurrent();
      expect(current?.ra).toBe(180);
      expect(current?.dec).toBe(45);
    });

    it('should return null when history is empty', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      expect(result.current.getCurrent()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const { result } = renderHook(() => useNavigationHistoryStore());
      
      act(() => {
        result.current.push({ ra: 0, dec: 0, fov: 60 });
        result.current.push({ ra: 90, dec: 0, fov: 60 });
        result.current.clear();
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
    });
  });
});

describe('formatNavigationPoint', () => {
  it('should format RA and Dec correctly', () => {
    const point: NavigationPoint = {
      id: 'test',
      ra: 180, // 12h 0m
      dec: 45.5,
      fov: 60,
      timestamp: Date.now(),
    };
    
    const formatted = formatNavigationPoint(point);
    expect(formatted).toBe('12h0m +45.5°');
  });

  it('should format negative Dec correctly', () => {
    const point: NavigationPoint = {
      id: 'test',
      ra: 90, // 6h 0m
      dec: -30.5,
      fov: 60,
      timestamp: Date.now(),
    };
    
    const formatted = formatNavigationPoint(point);
    expect(formatted).toBe('6h0m -30.5°');
  });

  it('should use point name if available', () => {
    const point: NavigationPoint = {
      id: 'test',
      ra: 180,
      dec: 45,
      fov: 60,
      name: 'Orion Nebula',
      timestamp: Date.now(),
    };
    
    const formatted = formatNavigationPoint(point);
    expect(formatted).toBe('Orion Nebula');
  });
});

describe('formatTimestamp', () => {
  const mockLabels = {
    justNow: 'Just now',
    minutesAgo: (mins: number) => `${mins}m ago`,
    hoursAgo: (hours: number) => `${hours}h ago`,
  };

  it('should return "Just now" for timestamps less than 1 minute ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now, mockLabels)).toBe('Just now');
    expect(formatTimestamp(now - 30000, mockLabels)).toBe('Just now'); // 30 seconds ago
  });

  it('should return minutes ago for timestamps less than 1 hour ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 5 * 60000, mockLabels)).toBe('5m ago');
    expect(formatTimestamp(now - 30 * 60000, mockLabels)).toBe('30m ago');
  });

  it('should return hours ago for timestamps less than 24 hours ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 2 * 60 * 60000, mockLabels)).toBe('2h ago');
    expect(formatTimestamp(now - 12 * 60 * 60000, mockLabels)).toBe('12h ago');
  });

  it('should return localized date for timestamps older than 24 hours', () => {
    const oldTimestamp = Date.now() - 48 * 60 * 60000; // 48 hours ago
    const result = formatTimestamp(oldTimestamp, mockLabels);
    // Should be a date string, not one of the relative time formats
    expect(result).not.toBe('Just now');
    expect(result).not.toMatch(/\d+m ago/);
    expect(result).not.toMatch(/\d+h ago/);
  });

  it('should support i18n labels', () => {
    const zhLabels = {
      justNow: '刚刚',
      minutesAgo: (mins: number) => `${mins}分钟前`,
      hoursAgo: (hours: number) => `${hours}小时前`,
    };
    
    const now = Date.now();
    expect(formatTimestamp(now, zhLabels)).toBe('刚刚');
    expect(formatTimestamp(now - 5 * 60000, zhLabels)).toBe('5分钟前');
    expect(formatTimestamp(now - 2 * 60 * 60000, zhLabels)).toBe('2小时前');
  });
});
