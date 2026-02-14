/**
 * Mock for aladin-lite module (loaded via CDN at runtime).
 * Provides stub implementations for all static API methods used in hooks.
 */
const mockInstance = {
  getRaDec: jest.fn(() => [0, 0]),
  gotoRaDec: jest.fn(),
  gotoObject: jest.fn(),
  animateToRaDec: jest.fn(),
  getFov: jest.fn(() => [60, 60]),
  setFov: jest.fn(),
  getSize: jest.fn(() => [800, 600]),
  setProjection: jest.fn(),
  pix2world: jest.fn(() => [0, 0]),
  world2pix: jest.fn(() => [400, 300]),
  setBaseImageLayer: jest.fn(),
  setOverlayImageLayer: jest.fn(),
  getBaseImageLayer: jest.fn(),
  newImageSurvey: jest.fn(),
  addCatalog: jest.fn(),
  addOverlay: jest.fn(),
  addMOC: jest.fn(),
  removeLayers: jest.fn(),
  on: jest.fn(),
  adjustFovForObject: jest.fn(),
  getViewDataURL: jest.fn(() => ''),
  showPopup: jest.fn(),
  hidePopup: jest.fn(),
  exportAsPNG: jest.fn(),
  showReticle: jest.fn(),
  getFovCorners: jest.fn(() => []),
  getShareURL: jest.fn(() => ''),
};

const A = {
  aladin: jest.fn(() => mockInstance),
  catalog: jest.fn(() => ({
    name: 'mock-catalog',
    addSources: jest.fn(),
    removeAll: jest.fn(),
  })),
  catalogFromVizieR: jest.fn(() => ({
    name: 'vizier-catalog',
    addSources: jest.fn(),
    removeAll: jest.fn(),
  })),
  catalogFromSIMBAD: jest.fn(() => ({
    name: 'simbad-catalog',
    addSources: jest.fn(),
    removeAll: jest.fn(),
  })),
  catalogFromNED: jest.fn(() => ({
    name: 'ned-catalog',
    addSources: jest.fn(),
    removeAll: jest.fn(),
  })),
  graphicOverlay: jest.fn(() => ({
    name: 'mock-overlay',
    add: jest.fn(),
    removeAll: jest.fn(),
    remove: jest.fn(),
  })),
  circle: jest.fn(() => ({ type: 'circle' })),
  marker: jest.fn(() => ({ type: 'marker' })),
  polyline: jest.fn(() => ({ type: 'polyline' })),
  imageHiPS: jest.fn(() => ({
    setAlpha: jest.fn(),
    setBlendingConfig: jest.fn(),
  })),
  MOCFromURL: jest.fn(() => ({
    hide: jest.fn(),
    show: jest.fn(),
    toggle: jest.fn(),
    setOpacity: jest.fn(),
  })),
  source: jest.fn(() => ({ type: 'source' })),
};

module.exports = A;
module.exports.default = A;
