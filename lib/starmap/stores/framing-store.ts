import { create } from 'zustand';
import type { FramingState } from '../types';

interface FramingStoreState extends FramingState {
  // Actions
  setRAangle: (angle: number) => void;
  setDECangle: (angle: number) => void;
  setRAangleString: (str: string) => void;
  setDECangleString: (str: string) => void;
  setRotationAngle: (angle: number) => void;
  setShowFramingModal: (show: boolean) => void;
  setSelectedItem: (item: FramingState['selectedItem']) => void;
  setContainerSize: (size: number) => void;
  setIsSlewing: (slewing: boolean) => void;
  setIsSlewingAndCentering: (slewing: boolean) => void;
  setCoordinates: (coords: {
    ra?: number;
    dec?: number;
    raString?: string;
    decString?: string;
  }) => void;
}

export const useFramingStore = create<FramingStoreState>((set) => ({
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
  
  setRAangle: (RAangle) => set({ RAangle }),
  setDECangle: (DECangle) => set({ DECangle }),
  setRAangleString: (RAangleString) => set({ RAangleString }),
  setDECangleString: (DECangleString) => set({ DECangleString }),
  setRotationAngle: (rotationAngle) => set({ rotationAngle }),
  setShowFramingModal: (showFramingModal) => set({ showFramingModal }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  setContainerSize: (containerSize) => set({ containerSize }),
  setIsSlewing: (isSlewing) => set({ isSlewing }),
  setIsSlewingAndCentering: (isSlewingAndCentering) => set({ isSlewingAndCentering }),
  setCoordinates: (coords) => set((state) => ({
    RAangle: coords.ra ?? state.RAangle,
    DECangle: coords.dec ?? state.DECangle,
    RAangleString: coords.raString ?? state.RAangleString,
    DECangleString: coords.decString ?? state.DECangleString,
  })),
}));
