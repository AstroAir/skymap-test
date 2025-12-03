/**
 * @jest-environment jsdom
 */
import { useFramingStore } from '../framing-store';

describe('useFramingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFramingStore.setState({
      RAangle: 0,
      DECangle: 90,
      RAangleString: '',
      DECangleString: '',
      rotationAngle: 0,
      showFramingModal: false,
      selectedItem: null,
      containerSize: 500,
      isSlewing: false,
      isSlewingAndCentering: false,
    });
  });

  describe('initial state', () => {
    it('has default RA angle of 0', () => {
      expect(useFramingStore.getState().RAangle).toBe(0);
    });

    it('has default DEC angle of 90', () => {
      expect(useFramingStore.getState().DECangle).toBe(90);
    });

    it('has empty angle strings initially', () => {
      expect(useFramingStore.getState().RAangleString).toBe('');
      expect(useFramingStore.getState().DECangleString).toBe('');
    });

    it('has rotation angle of 0', () => {
      expect(useFramingStore.getState().rotationAngle).toBe(0);
    });

    it('has framing modal hidden', () => {
      expect(useFramingStore.getState().showFramingModal).toBe(false);
    });

    it('has no selected item', () => {
      expect(useFramingStore.getState().selectedItem).toBeNull();
    });

    it('has default container size', () => {
      expect(useFramingStore.getState().containerSize).toBe(500);
    });

    it('is not slewing', () => {
      expect(useFramingStore.getState().isSlewing).toBe(false);
      expect(useFramingStore.getState().isSlewingAndCentering).toBe(false);
    });
  });

  describe('setRAangle', () => {
    it('sets RA angle', () => {
      useFramingStore.getState().setRAangle(180);
      expect(useFramingStore.getState().RAangle).toBe(180);
    });
  });

  describe('setDECangle', () => {
    it('sets DEC angle', () => {
      useFramingStore.getState().setDECangle(45);
      expect(useFramingStore.getState().DECangle).toBe(45);
    });
  });

  describe('setRAangleString', () => {
    it('sets RA angle string', () => {
      useFramingStore.getState().setRAangleString('12:00:00');
      expect(useFramingStore.getState().RAangleString).toBe('12:00:00');
    });
  });

  describe('setDECangleString', () => {
    it('sets DEC angle string', () => {
      useFramingStore.getState().setDECangleString('+45:00:00');
      expect(useFramingStore.getState().DECangleString).toBe('+45:00:00');
    });
  });

  describe('setRotationAngle', () => {
    it('sets rotation angle', () => {
      useFramingStore.getState().setRotationAngle(90);
      expect(useFramingStore.getState().rotationAngle).toBe(90);
    });
  });

  describe('setShowFramingModal', () => {
    it('shows framing modal', () => {
      useFramingStore.getState().setShowFramingModal(true);
      expect(useFramingStore.getState().showFramingModal).toBe(true);
    });

    it('hides framing modal', () => {
      useFramingStore.getState().setShowFramingModal(true);
      useFramingStore.getState().setShowFramingModal(false);
      expect(useFramingStore.getState().showFramingModal).toBe(false);
    });
  });

  describe('setSelectedItem', () => {
    it('sets selected item', () => {
      const item = { Name: 'Test Object', RA: 180, Dec: 45 };
      useFramingStore.getState().setSelectedItem(item);
      expect(useFramingStore.getState().selectedItem).toEqual(item);
    });

    it('clears selected item', () => {
      const item = { Name: 'Test Object', RA: 180, Dec: 45 };
      useFramingStore.getState().setSelectedItem(item);
      useFramingStore.getState().setSelectedItem(null);
      expect(useFramingStore.getState().selectedItem).toBeNull();
    });
  });

  describe('setContainerSize', () => {
    it('sets container size', () => {
      useFramingStore.getState().setContainerSize(800);
      expect(useFramingStore.getState().containerSize).toBe(800);
    });
  });

  describe('setIsSlewing', () => {
    it('sets slewing state', () => {
      useFramingStore.getState().setIsSlewing(true);
      expect(useFramingStore.getState().isSlewing).toBe(true);
    });
  });

  describe('setIsSlewingAndCentering', () => {
    it('sets slewing and centering state', () => {
      useFramingStore.getState().setIsSlewingAndCentering(true);
      expect(useFramingStore.getState().isSlewingAndCentering).toBe(true);
    });
  });

  describe('setCoordinates', () => {
    it('sets multiple coordinates at once', () => {
      useFramingStore.getState().setCoordinates({
        ra: 180,
        dec: 45,
        raString: '12:00:00',
        decString: '+45:00:00',
      });

      const state = useFramingStore.getState();
      expect(state.RAangle).toBe(180);
      expect(state.DECangle).toBe(45);
      expect(state.RAangleString).toBe('12:00:00');
      expect(state.DECangleString).toBe('+45:00:00');
    });

    it('preserves existing values when partial update', () => {
      useFramingStore.getState().setRAangle(100);
      useFramingStore.getState().setCoordinates({ dec: 30 });

      const state = useFramingStore.getState();
      expect(state.RAangle).toBe(100); // preserved
      expect(state.DECangle).toBe(30); // updated
    });
  });
});
