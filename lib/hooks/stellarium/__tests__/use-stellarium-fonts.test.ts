/**
 * Tests for use-stellarium-fonts.ts
 * Stellarium engine font setting
 */

import { renderHook } from '@testing-library/react';
import { useStellariumFonts } from '../use-stellarium-fonts';
import { useRef } from 'react';

describe('useStellariumFonts', () => {
  it('should return setEngineFont function', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumFonts(ref);
    });
    expect(typeof result.current.setEngineFont).toBe('function');
  });

  it('should throw when stel is null and setFont called', async () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumFonts(ref);
    });
    await expect(
      result.current.setEngineFont('regular', '/fonts/test.woff2')
    ).rejects.toThrow('Stellarium setFont API is not available');
  });

  it('should call stel.setFont when engine is available', async () => {
    const setFontMock = jest.fn(() => Promise.resolve());
    const mockStel = { setFont: setFontMock };

    const { result } = renderHook(() => {
      const ref = useRef(mockStel);
      return useStellariumFonts(ref as never);
    });

    await result.current.setEngineFont('bold', '/fonts/bold.woff2');
    expect(setFontMock).toHaveBeenCalledWith('bold', '/fonts/bold.woff2');
  });
});
