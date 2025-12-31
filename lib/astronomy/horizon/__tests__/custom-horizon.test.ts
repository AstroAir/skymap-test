/**
 * Unit tests for CustomHorizon class
 */

import {
  CustomHorizon,
  parseHorizonFile,
  exportHorizonFile,
  createFlatHorizon,
  createSampleHorizon,
  type HorizonPoint,
} from '../custom-horizon';

describe('CustomHorizon', () => {
  describe('constructor', () => {
    it('should create an empty horizon with default name', () => {
      const horizon = new CustomHorizon();
      expect(horizon.getName()).toBe('Custom Horizon');
      expect(horizon.hasPoints()).toBe(false);
      expect(horizon.pointCount).toBe(0);
    });

    it('should create horizon with custom name', () => {
      const horizon = new CustomHorizon('My Observatory');
      expect(horizon.getName()).toBe('My Observatory');
    });
  });

  describe('addPoint', () => {
    it('should add a single point', () => {
      const horizon = new CustomHorizon();
      horizon.addPoint(45, 10);
      expect(horizon.pointCount).toBe(1);
      expect(horizon.hasPoints()).toBe(true);
    });

    it('should normalize azimuth to 0-360 range', () => {
      const horizon = new CustomHorizon();
      horizon.addPoint(-45, 10);
      horizon.addPoint(400, 15);
      
      const points = horizon.getPoints();
      // Points are sorted by azimuth, so 40 comes before 315
      expect(points[0].azimuth).toBe(40);  // 400 - 360
      expect(points[1].azimuth).toBe(315); // -45 + 360
    });

    it('should replace existing point at same azimuth', () => {
      const horizon = new CustomHorizon();
      horizon.addPoint(90, 10);
      horizon.addPoint(90, 20);
      
      expect(horizon.pointCount).toBe(1);
      expect(horizon.getAltitude(90)).toBe(20);
    });
  });

  describe('setPoints', () => {
    it('should set multiple points at once', () => {
      const horizon = new CustomHorizon();
      const points: HorizonPoint[] = [
        { azimuth: 0, altitude: 10 },
        { azimuth: 90, altitude: 5 },
        { azimuth: 180, altitude: 15 },
        { azimuth: 270, altitude: 8 },
      ];
      
      horizon.setPoints(points);
      expect(horizon.pointCount).toBe(4);
    });

    it('should normalize azimuths when setting points', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: -90, altitude: 10 },
        { azimuth: 450, altitude: 15 },
      ]);
      
      const points = horizon.getPoints();
      expect(points.find(p => p.azimuth === 270)).toBeDefined();
      expect(points.find(p => p.azimuth === 90)).toBeDefined();
    });
  });

  describe('getAltitude', () => {
    it('should return 0 for empty horizon', () => {
      const horizon = new CustomHorizon();
      expect(horizon.getAltitude(45)).toBe(0);
    });

    it('should return exact value for defined azimuth', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: 0, altitude: 10 },
        { azimuth: 90, altitude: 20 },
        { azimuth: 180, altitude: 15 },
      ]);
      
      expect(horizon.getAltitude(0)).toBe(10);
      expect(horizon.getAltitude(90)).toBe(20);
      expect(horizon.getAltitude(180)).toBe(15);
    });

    it('should interpolate between points', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: 0, altitude: 10 },
        { azimuth: 90, altitude: 20 },
      ]);
      
      // Midpoint should be average
      expect(horizon.getAltitude(45)).toBe(15);
    });

    it('should handle wrap-around interpolation', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: 0, altitude: 10 },
        { azimuth: 270, altitude: 20 },
      ]);
      
      // 315 is between 270 and 0 (wrapping around)
      const alt = horizon.getAltitude(315);
      expect(alt).toBeGreaterThan(10);
      expect(alt).toBeLessThan(20);
    });

    it('should normalize input azimuth', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([{ azimuth: 45, altitude: 15 }]);
      
      expect(horizon.getAltitude(405)).toBe(15); // 405 - 360 = 45
      expect(horizon.getAltitude(-315)).toBe(15); // -315 + 360 = 45
    });
  });

  describe('isAboveHorizon', () => {
    it('should return true when above horizon', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([{ azimuth: 0, altitude: 10 }]);
      
      expect(horizon.isAboveHorizon(15, 0)).toBe(true);
      expect(horizon.isAboveHorizon(11, 0)).toBe(true);
    });

    it('should return false when below horizon', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([{ azimuth: 0, altitude: 10 }]);
      
      expect(horizon.isAboveHorizon(5, 0)).toBe(false);
      expect(horizon.isAboveHorizon(10, 0)).toBe(false); // Equal is not above
    });
  });

  describe('clear', () => {
    it('should remove all points', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: 0, altitude: 10 },
        { azimuth: 90, altitude: 20 },
      ]);
      
      horizon.clear();
      expect(horizon.pointCount).toBe(0);
      expect(horizon.hasPoints()).toBe(false);
    });
  });

  describe('getPoints', () => {
    it('should return sorted points by azimuth', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([
        { azimuth: 180, altitude: 15 },
        { azimuth: 0, altitude: 10 },
        { azimuth: 270, altitude: 20 },
        { azimuth: 90, altitude: 5 },
      ]);
      
      const points = horizon.getPoints();
      expect(points[0].azimuth).toBe(0);
      expect(points[1].azimuth).toBe(90);
      expect(points[2].azimuth).toBe(180);
      expect(points[3].azimuth).toBe(270);
    });

    it('should return a copy of points', () => {
      const horizon = new CustomHorizon();
      horizon.setPoints([{ azimuth: 0, altitude: 10 }]);
      
      const points = horizon.getPoints();
      points[0].altitude = 999;
      
      expect(horizon.getAltitude(0)).toBe(10); // Original unchanged
    });
  });

  describe('setName / getName', () => {
    it('should get and set name', () => {
      const horizon = new CustomHorizon('Original');
      expect(horizon.getName()).toBe('Original');
      
      horizon.setName('New Name');
      expect(horizon.getName()).toBe('New Name');
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize', () => {
      const original = new CustomHorizon('Test Horizon');
      original.setPoints([
        { azimuth: 0, altitude: 10 },
        { azimuth: 90, altitude: 20 },
        { azimuth: 180, altitude: 15 },
      ]);
      
      const json = original.toJSON();
      const restored = CustomHorizon.fromJSON(json);
      
      expect(restored.getName()).toBe('Test Horizon');
      expect(restored.pointCount).toBe(3);
      expect(restored.getAltitude(0)).toBe(10);
      expect(restored.getAltitude(90)).toBe(20);
    });

    it('should handle partial data', () => {
      const horizon = CustomHorizon.fromJSON({ name: 'Partial' });
      expect(horizon.getName()).toBe('Partial');
      expect(horizon.pointCount).toBe(0);
    });

    it('should handle empty data', () => {
      const horizon = CustomHorizon.fromJSON({});
      expect(horizon.getName()).toBe('Custom Horizon');
    });
  });

  describe('generateChartData', () => {
    it('should generate 360 points by default', () => {
      const horizon = createFlatHorizon(10);
      const data = horizon.generateChartData();
      
      expect(data.length).toBe(360);
      expect(data[0].azimuth).toBe(0);
      expect(data[0].altitude).toBe(10);
    });

    it('should respect custom resolution', () => {
      const horizon = createFlatHorizon(5);
      const data = horizon.generateChartData(36);
      
      expect(data.length).toBe(36);
    });
  });
});

describe('parseHorizonFile', () => {
  it('should parse CSV format', () => {
    const content = '0,10\n90,20\n180,15';
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(3);
    expect(points[0]).toEqual({ azimuth: 0, altitude: 10 });
    expect(points[1]).toEqual({ azimuth: 90, altitude: 20 });
  });

  it('should parse space-separated format', () => {
    const content = '0 10\n90 20\n180 15';
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(3);
  });

  it('should parse tab-separated format', () => {
    const content = '0\t10\n90\t20';
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(2);
  });

  it('should skip comments and empty lines', () => {
    const content = `# Header comment
0,10
// Another comment

90,20`;
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(2);
  });

  it('should handle Windows line endings', () => {
    const content = '0,10\r\n90,20\r\n180,15';
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(3);
  });

  it('should skip invalid lines', () => {
    const content = '0,10\ninvalid\n90,20';
    const points = parseHorizonFile(content);
    
    expect(points.length).toBe(2);
  });
});

describe('exportHorizonFile', () => {
  it('should export horizon to file content', () => {
    const horizon = new CustomHorizon();
    horizon.setPoints([
      { azimuth: 0, altitude: 10 },
      { azimuth: 90, altitude: 20 },
    ]);
    
    const content = exportHorizonFile(horizon);
    
    expect(content).toContain('# Custom Horizon File');
    expect(content).toContain('0.0,10.0');
    expect(content).toContain('90.0,20.0');
  });

  it('should be parseable by parseHorizonFile', () => {
    const original = new CustomHorizon();
    original.setPoints([
      { azimuth: 45, altitude: 12.5 },
      { azimuth: 135, altitude: 8.3 },
    ]);
    
    const content = exportHorizonFile(original);
    const parsed = parseHorizonFile(content);
    
    expect(parsed.length).toBe(2);
    expect(parsed[0].azimuth).toBeCloseTo(45, 0);
    expect(parsed[0].altitude).toBeCloseTo(12.5, 0);
  });
});

describe('createFlatHorizon', () => {
  it('should create horizon with uniform altitude', () => {
    const horizon = createFlatHorizon(15);
    
    expect(horizon.getName()).toBe('Flat Horizon');
    expect(horizon.getAltitude(0)).toBe(15);
    expect(horizon.getAltitude(45)).toBe(15);
    expect(horizon.getAltitude(180)).toBe(15);
    expect(horizon.getAltitude(315)).toBe(15);
  });

  it('should default to 0 altitude', () => {
    const horizon = createFlatHorizon();
    expect(horizon.getAltitude(90)).toBe(0);
  });
});

describe('createSampleHorizon', () => {
  it('should create horizon with varying altitudes', () => {
    const horizon = createSampleHorizon();
    
    expect(horizon.getName()).toBe('Sample Horizon');
    expect(horizon.pointCount).toBe(8);
    
    // Should have different altitudes in different directions
    const north = horizon.getAltitude(0);
    const east = horizon.getAltitude(90);
    const south = horizon.getAltitude(180);
    
    expect(north).not.toBe(east);
    expect(south).not.toBe(east);
  });
});
