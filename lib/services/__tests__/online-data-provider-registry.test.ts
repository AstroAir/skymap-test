import {
  getDefaultObjectInfoDataSourceConfigs,
  getDefaultSearchSourceConfigs,
  getEligibleSearchProviders,
} from '../online-data-provider-registry';

describe('online-data-provider-registry', () => {
  it('includes SBDB in default search providers', () => {
    const defaults = getDefaultSearchSourceConfigs();

    expect(defaults.some((source) => source.id === 'sbdb')).toBe(true);
  });

  it('prioritizes small-body-capable providers for minor-object queries', () => {
    expect(getEligibleSearchProviders('minor')).toEqual(
      expect.arrayContaining(['sbdb', 'mpc'])
    );
    expect(getEligibleSearchProviders('minor')[0]).toBe('sbdb');
  });

  it('restricts coordinate search providers to coordinate-capable sources', () => {
    expect(getEligibleSearchProviders('coordinates')).toEqual(['simbad']);
  });

  it('includes cross-surface object-info defaults for description and small-body enrichment', () => {
    const defaults = getDefaultObjectInfoDataSourceConfigs();

    expect(defaults.some((source) => source.id === 'wikipedia')).toBe(true);
    expect(defaults.some((source) => source.id === 'sbdb')).toBe(true);
  });
});
