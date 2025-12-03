/**
 * @jest-environment jsdom
 */
import { useMountStore } from '../mount-store';

describe('useMountStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMountStore.setState({
      mountInfo: {
        Connected: false,
        Coordinates: {
          RADegrees: 0,
          Dec: 0,
        },
      },
      profileInfo: {
        AstrometrySettings: {
          Latitude: 0,
          Longitude: 0,
          Elevation: 0,
        },
      },
      sequenceRunning: false,
      currentTab: 'showSlew',
    });
  });

  describe('initial state', () => {
    it('has mount disconnected initially', () => {
      const { mountInfo } = useMountStore.getState();
      expect(mountInfo.Connected).toBe(false);
    });

    it('has zero coordinates initially', () => {
      const { mountInfo } = useMountStore.getState();
      expect(mountInfo.Coordinates.RADegrees).toBe(0);
      expect(mountInfo.Coordinates.Dec).toBe(0);
    });

    it('has default profile info', () => {
      const { profileInfo } = useMountStore.getState();
      expect(profileInfo.AstrometrySettings.Latitude).toBe(0);
      expect(profileInfo.AstrometrySettings.Longitude).toBe(0);
      expect(profileInfo.AstrometrySettings.Elevation).toBe(0);
    });

    it('has sequence not running initially', () => {
      const { sequenceRunning } = useMountStore.getState();
      expect(sequenceRunning).toBe(false);
    });

    it('has default current tab', () => {
      const { currentTab } = useMountStore.getState();
      expect(currentTab).toBe('showSlew');
    });
  });

  describe('setMountInfo', () => {
    it('updates mount info partially', () => {
      useMountStore.getState().setMountInfo({ Connected: true });
      
      const { mountInfo } = useMountStore.getState();
      expect(mountInfo.Connected).toBe(true);
      expect(mountInfo.Coordinates.RADegrees).toBe(0); // unchanged
    });
  });

  describe('setMountCoordinates', () => {
    it('updates mount coordinates', () => {
      useMountStore.getState().setMountCoordinates(180, 45);
      
      const { mountInfo } = useMountStore.getState();
      expect(mountInfo.Coordinates.RADegrees).toBe(180);
      expect(mountInfo.Coordinates.Dec).toBe(45);
    });

    it('preserves connected state', () => {
      useMountStore.getState().setMountConnected(true);
      useMountStore.getState().setMountCoordinates(90, 30);
      
      const { mountInfo } = useMountStore.getState();
      expect(mountInfo.Connected).toBe(true);
      expect(mountInfo.Coordinates.RADegrees).toBe(90);
    });
  });

  describe('setMountConnected', () => {
    it('sets mount connected state', () => {
      useMountStore.getState().setMountConnected(true);
      
      expect(useMountStore.getState().mountInfo.Connected).toBe(true);
    });

    it('can disconnect mount', () => {
      useMountStore.getState().setMountConnected(true);
      useMountStore.getState().setMountConnected(false);
      
      expect(useMountStore.getState().mountInfo.Connected).toBe(false);
    });
  });

  describe('setProfileInfo', () => {
    it('updates profile info', () => {
      useMountStore.getState().setProfileInfo({
        AstrometrySettings: {
          Latitude: 40.7128,
          Longitude: -74.006,
          Elevation: 10,
        },
      });
      
      const { profileInfo } = useMountStore.getState();
      expect(profileInfo.AstrometrySettings.Latitude).toBe(40.7128);
      expect(profileInfo.AstrometrySettings.Longitude).toBe(-74.006);
      expect(profileInfo.AstrometrySettings.Elevation).toBe(10);
    });
  });

  describe('setSequenceRunning', () => {
    it('sets sequence running state', () => {
      useMountStore.getState().setSequenceRunning(true);
      
      expect(useMountStore.getState().sequenceRunning).toBe(true);
    });

    it('can stop sequence', () => {
      useMountStore.getState().setSequenceRunning(true);
      useMountStore.getState().setSequenceRunning(false);
      
      expect(useMountStore.getState().sequenceRunning).toBe(false);
    });
  });

  describe('setCurrentTab', () => {
    it('sets current tab', () => {
      useMountStore.getState().setCurrentTab('settings');
      
      expect(useMountStore.getState().currentTab).toBe('settings');
    });
  });
});
