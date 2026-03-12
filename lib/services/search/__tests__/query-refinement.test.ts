import { refineSearchQuery } from '../query-refinement';

describe('refineSearchQuery', () => {
  it('normalizes catalog aliases into canonical catalog ids', () => {
    const refined = refineSearchQuery('messier 31');
    expect(refined.executionQuery).toBe('M31');
    expect(refined.normalizationSteps.length).toBeGreaterThan(0);
  });

  it('provides warning hint for malformed @ coordinate query', () => {
    const refined = refineSearchQuery('@not-a-coordinate');
    expect(refined.executionQuery).toBe('@not-a-coordinate');
    expect(refined.refinementHints.some(hint => hint.code === 'COORDINATE_FORMAT_HINT')).toBe(true);
  });

  it('normalizes minor object designation patterns', () => {
    const refined = refineSearchQuery('2007ta418');
    expect(refined.executionQuery).toBe('2007 TA418');
    expect(refined.refinementHints.some(hint => hint.code === 'MINOR_IDENTIFIER_NORMALIZED')).toBe(true);
  });
});
