/**
 * Unit tests for equipment utility functions
 * Tests camera brand detection, filtering, and grouping logic
 */

// Camera brand detection function (extracted for testing)
function getCameraBrand(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('sony') || nameLower.includes('a7')) return 'Sony';
  if (nameLower.includes('canon') || nameLower.includes('eos')) return 'Canon';
  if (nameLower.includes('nikon') || nameLower.includes('nikkor')) return 'Nikon';
  if (nameLower.includes('zwo') || nameLower.includes('asi')) return 'ZWO';
  if (nameLower.includes('qhy')) return 'QHY';
  if (nameLower.includes('player one') || nameLower.includes('poseidon') || nameLower.includes('ares') || nameLower.includes('neptune') || nameLower.includes('uranus') || nameLower.includes('mars-c')) return 'Player One';
  if (nameLower.includes('atik')) return 'Atik';
  if (nameLower.includes('sbig')) return 'SBIG';
  if (nameLower.includes('fli') || nameLower.includes('kepler')) return 'FLI';
  if (nameLower.includes('moravian')) return 'Moravian';
  if (nameLower.includes('fuji')) return 'Fujifilm';
  if (nameLower.includes('olympus') || nameLower.includes('om system')) return 'OM System';
  if (nameLower.includes('panasonic')) return 'Panasonic';
  if (nameLower.includes('full frame') || nameLower.includes('aps-c') || nameLower.includes('micro')) return 'Generic';
  return 'Other';
}

// Camera type for testing
interface Camera {
  id: string;
  name: string;
  sensorWidth: number;
  sensorHeight: number;
}

// Telescope type for testing
interface Telescope {
  id: string;
  name: string;
  focalLength: number;
  aperture: number;
  type?: string;
}

// Filter cameras by search term
function filterCameras(cameras: Camera[], search: string): Camera[] {
  const searchLower = search.toLowerCase().trim();
  if (!searchLower) return cameras;
  return cameras.filter((camera) => camera.name.toLowerCase().includes(searchLower));
}

// Group cameras by brand
function groupCamerasByBrand(cameras: Camera[]): { brand: string; cameras: Camera[] }[] {
  const groups: Record<string, Camera[]> = {};
  const brandOrder = ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'OM System', 'Panasonic', 'ZWO', 'QHY', 'Player One', 'Atik', 'SBIG', 'FLI', 'Moravian', 'Generic', 'Other'];
  
  cameras.forEach((camera) => {
    const brand = getCameraBrand(camera.name);
    if (!groups[brand]) groups[brand] = [];
    groups[brand].push(camera);
  });
  
  return brandOrder
    .filter((brand) => groups[brand]?.length > 0)
    .map((brand) => ({ brand, cameras: groups[brand] }));
}

// Filter telescopes by search term
function filterTelescopes(telescopes: Telescope[], search: string): Telescope[] {
  const searchLower = search.toLowerCase().trim();
  if (!searchLower) return telescopes;
  return telescopes.filter((t) => 
    t.name.toLowerCase().includes(searchLower) ||
    (t.type && t.type.toLowerCase().includes(searchLower))
  );
}

// Group telescopes by type
function groupTelescopesByType(telescopes: Telescope[]): { type: string; telescopes: Telescope[] }[] {
  const groups: Record<string, Telescope[]> = {};
  const typeOrder = ['Lens', 'APO', 'Newtonian', 'SCT', 'RC', 'RASA', 'Mak'];
  
  telescopes.forEach((telescope) => {
    const type = telescope.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(telescope);
  });
  
  return typeOrder
    .filter((type) => groups[type]?.length > 0)
    .map((type) => ({ type, telescopes: groups[type] }));
}

// Test data
const TEST_CAMERAS: Camera[] = [
  { id: 'canon-5d4', name: 'Canon EOS 5D Mark IV', sensorWidth: 36, sensorHeight: 24 },
  { id: 'canon-r5', name: 'Canon EOS R5', sensorWidth: 36, sensorHeight: 24 },
  { id: 'sony-a7r4', name: 'Sony A7R IV', sensorWidth: 35.7, sensorHeight: 23.8 },
  { id: 'sony-a7s3', name: 'Sony A7S III', sensorWidth: 35.6, sensorHeight: 23.8 },
  { id: 'nikon-z8', name: 'Nikon Z8', sensorWidth: 35.9, sensorHeight: 23.9 },
  { id: 'zwo-asi294', name: 'ZWO ASI294MC Pro', sensorWidth: 23.2, sensorHeight: 15.5 },
  { id: 'zwo-asi2600', name: 'ZWO ASI2600MC Pro', sensorWidth: 23.5, sensorHeight: 15.7 },
  { id: 'qhy-600m', name: 'QHY600M', sensorWidth: 36, sensorHeight: 24 },
  { id: 'player-one-poseidon', name: 'Player One Poseidon-C Pro', sensorWidth: 23.5, sensorHeight: 15.7 },
  { id: 'atik-16200', name: 'Atik 16200', sensorWidth: 27.0, sensorHeight: 21.6 },
  { id: 'fuji-xt5', name: 'Fujifilm X-T5', sensorWidth: 23.5, sensorHeight: 15.6 },
  { id: 'generic-ff', name: 'Full Frame Generic', sensorWidth: 36, sensorHeight: 24 },
  { id: 'unknown-cam', name: 'Custom Camera XYZ', sensorWidth: 20, sensorHeight: 15 },
];

const TEST_TELESCOPES: Telescope[] = [
  { id: 'lens-85', name: '85mm f/1.4 Lens', focalLength: 85, aperture: 60, type: 'Lens' },
  { id: 'lens-200', name: '200mm f/2.8 Lens', focalLength: 200, aperture: 71, type: 'Lens' },
  { id: 'apo-80', name: 'Sharpstar 80ED APO', focalLength: 480, aperture: 80, type: 'APO' },
  { id: 'apo-130', name: 'TS-Optics 130mm APO', focalLength: 910, aperture: 130, type: 'APO' },
  { id: 'newton-200', name: 'GSO 200mm Newtonian', focalLength: 800, aperture: 200, type: 'Newtonian' },
  { id: 'sct-8', name: 'Celestron C8 SCT', focalLength: 2032, aperture: 203, type: 'SCT' },
  { id: 'rc-8', name: 'GSO 8" RC', focalLength: 1624, aperture: 203, type: 'RC' },
  { id: 'rasa-8', name: 'Celestron RASA 8"', focalLength: 400, aperture: 203, type: 'RASA' },
  { id: 'mak-127', name: 'Skywatcher Mak 127', focalLength: 1500, aperture: 127, type: 'Mak' },
];

describe('Camera Brand Detection', () => {
  describe('getCameraBrand', () => {
    test('should detect Canon cameras', () => {
      expect(getCameraBrand('Canon EOS 5D Mark IV')).toBe('Canon');
      expect(getCameraBrand('Canon EOS R5')).toBe('Canon');
      expect(getCameraBrand('EOS 6D')).toBe('Canon');
    });

    test('should detect Sony cameras', () => {
      expect(getCameraBrand('Sony A7R IV')).toBe('Sony');
      expect(getCameraBrand('Sony A7S III')).toBe('Sony');
      expect(getCameraBrand('A7 III')).toBe('Sony');
    });

    test('should detect Nikon cameras', () => {
      expect(getCameraBrand('Nikon Z8')).toBe('Nikon');
      expect(getCameraBrand('Nikon D850')).toBe('Nikon');
      expect(getCameraBrand('Nikkor lens camera')).toBe('Nikon');
    });

    test('should detect ZWO cameras', () => {
      expect(getCameraBrand('ZWO ASI294MC Pro')).toBe('ZWO');
      expect(getCameraBrand('ASI2600MC')).toBe('ZWO');
      expect(getCameraBrand('ZWO ASI183MM')).toBe('ZWO');
    });

    test('should detect QHY cameras', () => {
      expect(getCameraBrand('QHY600M')).toBe('QHY');
      expect(getCameraBrand('QHY268C')).toBe('QHY');
    });

    test('should detect Player One cameras', () => {
      expect(getCameraBrand('Player One Poseidon-C Pro')).toBe('Player One');
      expect(getCameraBrand('Poseidon-M')).toBe('Player One');
      expect(getCameraBrand('Ares-C Pro')).toBe('Player One');
      expect(getCameraBrand('Neptune-C II')).toBe('Player One');
      expect(getCameraBrand('Uranus-C')).toBe('Player One');
      expect(getCameraBrand('Mars-C')).toBe('Player One');
    });

    test('should detect Atik cameras', () => {
      expect(getCameraBrand('Atik 16200')).toBe('Atik');
      expect(getCameraBrand('Atik Horizon')).toBe('Atik');
    });

    test('should detect SBIG cameras', () => {
      expect(getCameraBrand('SBIG STF-8300M')).toBe('SBIG');
      expect(getCameraBrand('SBIG STXL-11002')).toBe('SBIG');
    });

    test('should detect FLI cameras', () => {
      expect(getCameraBrand('FLI ML16803')).toBe('FLI');
      expect(getCameraBrand('Kepler KL400')).toBe('FLI');
    });

    test('should detect Moravian cameras', () => {
      expect(getCameraBrand('Moravian C3-61000')).toBe('Moravian');
    });

    test('should detect Fujifilm cameras', () => {
      expect(getCameraBrand('Fujifilm X-T5')).toBe('Fujifilm');
      expect(getCameraBrand('Fuji GFX 100')).toBe('Fujifilm');
    });

    test('should detect OM System cameras', () => {
      expect(getCameraBrand('Olympus OM-D E-M1')).toBe('OM System');
      expect(getCameraBrand('OM System OM-1')).toBe('OM System');
    });

    test('should detect Panasonic cameras', () => {
      expect(getCameraBrand('Panasonic S1H')).toBe('Panasonic');
      expect(getCameraBrand('Panasonic GH6')).toBe('Panasonic');
    });

    test('should detect Generic sensor types', () => {
      expect(getCameraBrand('Full Frame Generic')).toBe('Generic');
      expect(getCameraBrand('APS-C Sensor')).toBe('Generic');
      expect(getCameraBrand('Micro Four Thirds')).toBe('Generic');
    });

    test('should return Other for unknown brands', () => {
      expect(getCameraBrand('Custom Camera XYZ')).toBe('Other');
      expect(getCameraBrand('Unknown Brand ABC')).toBe('Other');
    });

    test('should be case-insensitive', () => {
      expect(getCameraBrand('CANON EOS 5D')).toBe('Canon');
      expect(getCameraBrand('sony a7r')).toBe('Sony');
      expect(getCameraBrand('ZWO asi294')).toBe('ZWO');
    });
  });
});

describe('Camera Filtering', () => {
  describe('filterCameras', () => {
    test('should return all cameras when search is empty', () => {
      expect(filterCameras(TEST_CAMERAS, '')).toEqual(TEST_CAMERAS);
      expect(filterCameras(TEST_CAMERAS, '   ')).toEqual(TEST_CAMERAS);
    });

    test('should filter by camera name', () => {
      const result = filterCameras(TEST_CAMERAS, 'Canon');
      expect(result).toHaveLength(2);
      expect(result.every(c => c.name.includes('Canon'))).toBe(true);
    });

    test('should be case-insensitive', () => {
      const result1 = filterCameras(TEST_CAMERAS, 'canon');
      const result2 = filterCameras(TEST_CAMERAS, 'CANON');
      expect(result1).toEqual(result2);
    });

    test('should filter by partial match', () => {
      const result = filterCameras(TEST_CAMERAS, 'ASI');
      expect(result).toHaveLength(2);
      expect(result.every(c => c.name.includes('ASI'))).toBe(true);
    });

    test('should return empty array when no matches', () => {
      const result = filterCameras(TEST_CAMERAS, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });
});

describe('Camera Grouping', () => {
  describe('groupCamerasByBrand', () => {
    test('should group cameras by detected brand', () => {
      const groups = groupCamerasByBrand(TEST_CAMERAS);
      
      // Check Canon group
      const canonGroup = groups.find(g => g.brand === 'Canon');
      expect(canonGroup).toBeDefined();
      expect(canonGroup?.cameras).toHaveLength(2);
      
      // Check Sony group
      const sonyGroup = groups.find(g => g.brand === 'Sony');
      expect(sonyGroup).toBeDefined();
      expect(sonyGroup?.cameras).toHaveLength(2);
      
      // Check ZWO group
      const zwoGroup = groups.find(g => g.brand === 'ZWO');
      expect(zwoGroup).toBeDefined();
      expect(zwoGroup?.cameras).toHaveLength(2);
    });

    test('should maintain brand order', () => {
      const groups = groupCamerasByBrand(TEST_CAMERAS);
      const brandNames = groups.map(g => g.brand);
      
      // Canon should come before Sony
      const canonIndex = brandNames.indexOf('Canon');
      const sonyIndex = brandNames.indexOf('Sony');
      expect(canonIndex).toBeLessThan(sonyIndex);
      
      // ZWO should come after consumer brands
      const zwoIndex = brandNames.indexOf('ZWO');
      expect(zwoIndex).toBeGreaterThan(sonyIndex);
    });

    test('should include Other group for unknown brands', () => {
      const groups = groupCamerasByBrand(TEST_CAMERAS);
      const otherGroup = groups.find(g => g.brand === 'Other');
      expect(otherGroup).toBeDefined();
      expect(otherGroup?.cameras.some(c => c.name === 'Custom Camera XYZ')).toBe(true);
    });

    test('should not include empty groups', () => {
      const groups = groupCamerasByBrand(TEST_CAMERAS);
      groups.forEach(group => {
        expect(group.cameras.length).toBeGreaterThan(0);
      });
    });

    test('should handle empty camera list', () => {
      const groups = groupCamerasByBrand([]);
      expect(groups).toHaveLength(0);
    });
  });
});

describe('Telescope Filtering', () => {
  describe('filterTelescopes', () => {
    test('should return all telescopes when search is empty', () => {
      expect(filterTelescopes(TEST_TELESCOPES, '')).toEqual(TEST_TELESCOPES);
    });

    test('should filter by telescope name', () => {
      const result = filterTelescopes(TEST_TELESCOPES, 'Celestron');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.name.includes('Celestron'))).toBe(true);
    });

    test('should filter by telescope type', () => {
      const result = filterTelescopes(TEST_TELESCOPES, 'APO');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'APO')).toBe(true);
    });

    test('should be case-insensitive', () => {
      const result1 = filterTelescopes(TEST_TELESCOPES, 'apo');
      const result2 = filterTelescopes(TEST_TELESCOPES, 'APO');
      expect(result1).toEqual(result2);
    });

    test('should match both name and type', () => {
      const result = filterTelescopes(TEST_TELESCOPES, 'Newtonian');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(t => 
        t.name.toLowerCase().includes('newtonian') || 
        t.type?.toLowerCase().includes('newtonian')
      )).toBe(true);
    });

    test('should return empty array when no matches', () => {
      const result = filterTelescopes(TEST_TELESCOPES, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });
});

describe('Telescope Grouping', () => {
  describe('groupTelescopesByType', () => {
    test('should group telescopes by type', () => {
      const groups = groupTelescopesByType(TEST_TELESCOPES);
      
      // Check Lens group
      const lensGroup = groups.find(g => g.type === 'Lens');
      expect(lensGroup).toBeDefined();
      expect(lensGroup?.telescopes).toHaveLength(2);
      
      // Check APO group
      const apoGroup = groups.find(g => g.type === 'APO');
      expect(apoGroup).toBeDefined();
      expect(apoGroup?.telescopes).toHaveLength(2);
    });

    test('should maintain type order', () => {
      const groups = groupTelescopesByType(TEST_TELESCOPES);
      const typeNames = groups.map(g => g.type);
      
      // Lens should come first
      expect(typeNames[0]).toBe('Lens');
      
      // APO should come before Newtonian
      const apoIndex = typeNames.indexOf('APO');
      const newtonianIndex = typeNames.indexOf('Newtonian');
      expect(apoIndex).toBeLessThan(newtonianIndex);
    });

    test('should not include empty groups', () => {
      const groups = groupTelescopesByType(TEST_TELESCOPES);
      groups.forEach(group => {
        expect(group.telescopes.length).toBeGreaterThan(0);
      });
    });

    test('should handle empty telescope list', () => {
      const groups = groupTelescopesByType([]);
      expect(groups).toHaveLength(0);
    });

    test('should handle telescopes without type', () => {
      const telescopesWithMissingType: Telescope[] = [
        { id: 'no-type', name: 'Unknown Scope', focalLength: 1000, aperture: 150 },
      ];
      const groups = groupTelescopesByType(telescopesWithMissingType);
      // Should not create groups since 'Other' is not in typeOrder
      expect(groups).toHaveLength(0);
    });
  });
});

describe('Integration: Filter and Group', () => {
  test('should filter then group cameras correctly', () => {
    const filtered = filterCameras(TEST_CAMERAS, 'ZWO');
    const grouped = groupCamerasByBrand(filtered);
    
    expect(grouped).toHaveLength(1);
    expect(grouped[0].brand).toBe('ZWO');
    expect(grouped[0].cameras).toHaveLength(2);
  });

  test('should filter then group telescopes correctly', () => {
    const filtered = filterTelescopes(TEST_TELESCOPES, 'Lens');
    const grouped = groupTelescopesByType(filtered);
    
    expect(grouped).toHaveLength(1);
    expect(grouped[0].type).toBe('Lens');
    expect(grouped[0].telescopes).toHaveLength(2);
  });

  test('should handle search that returns cameras from multiple brands', () => {
    const filtered = filterCameras(TEST_CAMERAS, 'Pro');
    const grouped = groupCamerasByBrand(filtered);
    
    // Should have cameras from ZWO and Player One
    expect(grouped.length).toBeGreaterThanOrEqual(2);
  });
});
