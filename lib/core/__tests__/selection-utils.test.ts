/**
 * Tests for selection-utils.ts
 * Selection data derivation from SelectedObjectData
 */

import { buildSelectionData } from '../selection-utils';
import type { SelectedObjectData } from '@/lib/core/types';

describe('buildSelectionData', () => {
  it('should return null selections for null input', () => {
    const result = buildSelectionData(null);
    expect(result.currentSelection).toBeNull();
    expect(result.observationSelection).toBeNull();
  });

  it('should derive currentSelection from selected object', () => {
    const obj: SelectedObjectData = {
      names: ['M31', 'Andromeda Galaxy'],
      raDeg: 10.68,
      decDeg: 41.27,
      ra: '0h 42m 44s',
      dec: '+41° 16\' 09"',
      type: 'Galaxy',
      constellation: 'And',
    } as unknown as SelectedObjectData;
    const result = buildSelectionData(obj);
    expect(result.currentSelection).not.toBeNull();
    expect(result.currentSelection!.name).toBe('M31');
    expect(result.currentSelection!.ra).toBe(10.68);
    expect(result.currentSelection!.dec).toBe(41.27);
  });

  it('should derive observationSelection with type and constellation', () => {
    const obj: SelectedObjectData = {
      names: ['M42'],
      raDeg: 83.82,
      decDeg: -5.39,
      ra: '5h 35m 17s',
      dec: '-5° 23\' 28"',
      type: 'Nebula',
      constellation: 'Ori',
    } as unknown as SelectedObjectData;
    const result = buildSelectionData(obj);
    expect(result.observationSelection).not.toBeNull();
    expect(result.observationSelection!.type).toBe('Nebula');
    expect(result.observationSelection!.constellation).toBe('Ori');
  });

  it('should use "Unknown" when names array is empty', () => {
    const obj: SelectedObjectData = {
      names: [],
      raDeg: 0,
      decDeg: 0,
      ra: '',
      dec: '',
      type: 'Star',
      constellation: '',
    } as unknown as SelectedObjectData;
    const result = buildSelectionData(obj);
    expect(result.currentSelection!.name).toBe('Unknown');
  });
});
