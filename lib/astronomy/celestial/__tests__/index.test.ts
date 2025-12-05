/**
 * @jest-environment node
 */
import * as celestial from '../index';

describe('Celestial Module Exports', () => {
  it('exports sun functions', () => {
    expect(celestial.getSunPosition).toBeDefined();
    expect(celestial.getSunAltitude).toBeDefined();
    expect(celestial.getSunDeclination).toBeDefined();
    expect(celestial.getEquationOfTime).toBeDefined();
  });

  it('exports moon functions', () => {
    expect(celestial.getMoonPhase).toBeDefined();
    expect(celestial.getMoonPhaseName).toBeDefined();
    expect(celestial.getMoonIllumination).toBeDefined();
    expect(celestial.getMoonInfo).toBeDefined();
    expect(celestial.getMoonPosition).toBeDefined();
    expect(celestial.getMoonAltitude).toBeDefined();
    expect(celestial.isMoonUp).toBeDefined();
    expect(celestial.getNextMoonPhase).toBeDefined();
  });

  it('exports moon constants', () => {
    expect(celestial.SYNODIC_MONTH).toBeDefined();
    expect(celestial.MOON_PHASE_NAMES).toBeDefined();
  });

  it('exports separation functions', () => {
    expect(celestial.angularSeparation).toBeDefined();
    expect(celestial.getMoonDistance).toBeDefined();
    expect(celestial.isTooCloseToMoon).toBeDefined();
    expect(celestial.getMoonInterference).toBeDefined();
    expect(celestial.getOptimalMoonWindow).toBeDefined();
  });
});
