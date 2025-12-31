/**
 * Tests for framing-store.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useFramingStore } from '../framing-store';

describe('useFramingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useFramingStore());
    act(() => {
      result.current.setRAangle(0);
      result.current.setDECangle(90);
      result.current.setRAangleString('');
      result.current.setDECangleString('');
      result.current.setRotationAngle(0);
      result.current.setShowFramingModal(false);
      result.current.setSelectedItem(null);
      result.current.setContainerSize(500);
      result.current.setIsSlewing(false);
      result.current.setIsSlewingAndCentering(false);
    });
  });

  describe('initial state', () => {
    it('should have default RA angle of 0', () => {
      const { result } = renderHook(() => useFramingStore());
      expect(result.current.RAangle).toBe(0);
    });

    it('should have default DEC angle of 90', () => {
      const { result } = renderHook(() => useFramingStore());
      expect(result.current.DECangle).toBe(90);
    });

    it('should have showFramingModal as false', () => {
      const { result } = renderHook(() => useFramingStore());
      expect(result.current.showFramingModal).toBe(false);
    });

    it('should have default containerSize of 500', () => {
      const { result } = renderHook(() => useFramingStore());
      expect(result.current.containerSize).toBe(500);
    });
  });

  describe('setRAangle', () => {
    it('should update RA angle', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setRAangle(180);
      });
      expect(result.current.RAangle).toBe(180);
    });
  });

  describe('setDECangle', () => {
    it('should update DEC angle', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setDECangle(45);
      });
      expect(result.current.DECangle).toBe(45);
    });
  });

  describe('setRAangleString', () => {
    it('should update RA angle string', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setRAangleString('12h 30m 00s');
      });
      expect(result.current.RAangleString).toBe('12h 30m 00s');
    });
  });

  describe('setDECangleString', () => {
    it('should update DEC angle string', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setDECangleString('+45° 00\' 00"');
      });
      expect(result.current.DECangleString).toBe('+45° 00\' 00"');
    });
  });

  describe('setRotationAngle', () => {
    it('should update rotation angle', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setRotationAngle(45);
      });
      expect(result.current.rotationAngle).toBe(45);
    });
  });

  describe('setShowFramingModal', () => {
    it('should update showFramingModal', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setShowFramingModal(true);
      });
      expect(result.current.showFramingModal).toBe(true);
    });
  });

  describe('setSelectedItem', () => {
    it('should update selectedItem', () => {
      const { result } = renderHook(() => useFramingStore());
      const item = { Name: 'M31', RA: 10.68, Dec: 41.27 };
      act(() => {
        result.current.setSelectedItem(item);
      });
      expect(result.current.selectedItem).toEqual(item);
    });

    it('should set selectedItem to null', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setSelectedItem({ Name: 'Test', RA: 0, Dec: 0 });
        result.current.setSelectedItem(null);
      });
      expect(result.current.selectedItem).toBeNull();
    });
  });

  describe('setContainerSize', () => {
    it('should update containerSize', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setContainerSize(800);
      });
      expect(result.current.containerSize).toBe(800);
    });
  });

  describe('setIsSlewing', () => {
    it('should update isSlewing', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setIsSlewing(true);
      });
      expect(result.current.isSlewing).toBe(true);
    });
  });

  describe('setIsSlewingAndCentering', () => {
    it('should update isSlewingAndCentering', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setIsSlewingAndCentering(true);
      });
      expect(result.current.isSlewingAndCentering).toBe(true);
    });
  });

  describe('setCoordinates', () => {
    it('should update all coordinates at once', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setCoordinates({
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
        });
      });
      expect(result.current.RAangle).toBe(180);
      expect(result.current.DECangle).toBe(45);
      expect(result.current.RAangleString).toBe('12h 00m 00s');
      expect(result.current.DECangleString).toBe('+45° 00\' 00"');
    });

    it('should update partial coordinates', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setRAangle(100);
        result.current.setCoordinates({ ra: 200 });
      });
      expect(result.current.RAangle).toBe(200);
    });

    it('should preserve existing values for unspecified coords', () => {
      const { result } = renderHook(() => useFramingStore());
      act(() => {
        result.current.setDECangle(30);
        result.current.setCoordinates({ ra: 100 });
      });
      expect(result.current.DECangle).toBe(30);
    });
  });
});
