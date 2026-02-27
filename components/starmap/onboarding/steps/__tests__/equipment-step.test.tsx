/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mocks ---

const mockApplyCamera = jest.fn();
const mockApplyTelescope = jest.fn();
const mockSetCameraSettings = jest.fn();
const mockSetTelescopeSettings = jest.fn();
const mockUpdateSetupData = jest.fn();

const defaultEquipmentState = {
  customTelescopes: [],
  customCameras: [],
  activeCameraId: null,
  activeTelescopeId: null,
  sensorWidth: 23.5,
  sensorHeight: 15.6,
  focalLength: 400,
  pixelSize: 3.76,
  aperture: 80,
  applyCamera: mockApplyCamera,
  applyTelescope: mockApplyTelescope,
  setCameraSettings: mockSetCameraSettings,
  setTelescopeSettings: mockSetTelescopeSettings,
};

jest.mock('@/lib/stores/equipment-store', () => ({
  useEquipmentStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector(defaultEquipmentState),
  ),
  BUILTIN_CAMERA_PRESETS: [
    { id: 'cam-1', name: 'ZWO ASI294MC', sensorWidth: 19.1, sensorHeight: 13.0, pixelSize: 4.63, isCustom: false },
    { id: 'cam-2', name: 'Canon EOS Ra', sensorWidth: 36.0, sensorHeight: 24.0, pixelSize: 5.36, isCustom: false },
  ],
  BUILTIN_TELESCOPE_PRESETS: [
    { id: 'tel-1', name: 'Celestron C8', focalLength: 2032, aperture: 203, type: 'SCT', isCustom: false },
    { id: 'tel-2', name: 'Skywatcher 80ED', focalLength: 600, aperture: 80, type: 'Refractor', isCustom: false },
  ],
}));

jest.mock('@/lib/stores/onboarding-store', () => ({
  useOnboardingStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = { updateSetupData: mockUpdateSetupData };
    return selector(state);
  }),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { EquipmentStep } from '../equipment-step';

describe('EquipmentStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders description and skip note', () => {
    render(<EquipmentStep />);
    expect(screen.getByText('setupWizard.steps.equipment.description')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.equipment.skipNote')).toBeInTheDocument();
  });

  it('renders telescope and camera section headers', () => {
    render(<EquipmentStep />);
    expect(screen.getByText('setupWizard.steps.equipment.telescope')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.equipment.camera')).toBeInTheDocument();
  });

  it('renders telescope presets', () => {
    render(<EquipmentStep />);
    expect(screen.getByText('Celestron C8')).toBeInTheDocument();
    expect(screen.getByText('Skywatcher 80ED')).toBeInTheDocument();
  });

  it('renders camera presets', () => {
    render(<EquipmentStep />);
    expect(screen.getByText('ZWO ASI294MC')).toBeInTheDocument();
    expect(screen.getByText('Canon EOS Ra')).toBeInTheDocument();
  });

  it('calls applyTelescope when a telescope preset is clicked', () => {
    render(<EquipmentStep />);
    fireEvent.click(screen.getByText('Celestron C8'));
    expect(mockApplyTelescope).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tel-1', name: 'Celestron C8' }),
    );
  });

  it('calls applyCamera when a camera preset is clicked', () => {
    render(<EquipmentStep />);
    fireEvent.click(screen.getByText('ZWO ASI294MC'));
    expect(mockApplyCamera).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cam-1', name: 'ZWO ASI294MC' }),
    );
  });

  it('calls updateSetupData with equipmentConfigured false when no equipment selected', () => {
    render(<EquipmentStep />);
    expect(mockUpdateSetupData).toHaveBeenCalledWith({ equipmentConfigured: false });
  });

  it('filters telescope list by search text', () => {
    render(<EquipmentStep />);
    const searchInputs = screen.getAllByPlaceholderText('setupWizard.steps.equipment.searchPlaceholder');
    // First search input is telescope search
    fireEvent.change(searchInputs[0], { target: { value: 'Celestron' } });
    expect(screen.getByText('Celestron C8')).toBeInTheDocument();
    expect(screen.queryByText('Skywatcher 80ED')).not.toBeInTheDocument();
  });

  it('filters camera list by search text', () => {
    render(<EquipmentStep />);
    const searchInputs = screen.getAllByPlaceholderText('setupWizard.steps.equipment.searchPlaceholder');
    // Second search input is camera search
    fireEvent.change(searchInputs[1], { target: { value: 'Canon' } });
    expect(screen.getByText('Canon EOS Ra')).toBeInTheDocument();
    expect(screen.queryByText('ZWO ASI294MC')).not.toBeInTheDocument();
  });

  it('shows manual telescope input form when toggle clicked', () => {
    render(<EquipmentStep />);
    const manualBtns = screen.getAllByText('setupWizard.steps.equipment.manualInput');
    // First manual input toggle is for telescope
    fireEvent.click(manualBtns[0]);
    expect(screen.getByLabelText(/fov.focalLength/)).toBeInTheDocument();
    expect(screen.getByLabelText(/equipment.aperture/)).toBeInTheDocument();
  });

  it('shows manual camera input form when toggle clicked', () => {
    render(<EquipmentStep />);
    const manualBtns = screen.getAllByText('setupWizard.steps.equipment.manualInput');
    // Second manual input toggle is for camera
    fireEvent.click(manualBtns[1]);
    expect(screen.getByLabelText(/fov.sensorWidth/)).toBeInTheDocument();
    expect(screen.getByLabelText(/fov.sensorHeight/)).toBeInTheDocument();
  });

  it('applies manual telescope settings', () => {
    render(<EquipmentStep />);
    // Open manual telescope form
    const manualBtns = screen.getAllByText('setupWizard.steps.equipment.manualInput');
    fireEvent.click(manualBtns[0]);

    // Fill focal length and aperture
    const focalInput = screen.getByLabelText(/fov.focalLength/);
    const apertureInput = screen.getByLabelText(/equipment.aperture/);
    fireEvent.change(focalInput, { target: { value: '1000' } });
    fireEvent.change(apertureInput, { target: { value: '200' } });

    // Click apply
    fireEvent.click(screen.getByText('common.apply'));
    expect(mockSetTelescopeSettings).toHaveBeenCalledWith(
      expect.objectContaining({ focalLength: 1000, aperture: 200 }),
    );
  });

  it('applies manual camera settings', () => {
    render(<EquipmentStep />);
    // Open manual camera form
    const manualBtns = screen.getAllByText('setupWizard.steps.equipment.manualInput');
    fireEvent.click(manualBtns[1]);

    // Fill sensor dimensions
    const sensorWidthInput = screen.getByLabelText(/fov.sensorWidth/);
    const sensorHeightInput = screen.getByLabelText(/fov.sensorHeight/);
    const pixelSizeInput = screen.getByLabelText(/fov.pixelSize/);
    fireEvent.change(sensorWidthInput, { target: { value: '22.3' } });
    fireEvent.change(sensorHeightInput, { target: { value: '14.9' } });
    fireEvent.change(pixelSizeInput, { target: { value: '4.3' } });

    // Click apply
    const applyBtns = screen.getAllByText('common.apply');
    fireEvent.click(applyBtns[applyBtns.length - 1]);
    expect(mockSetCameraSettings).toHaveBeenCalledWith(
      expect.objectContaining({ sensorWidth: 22.3, sensorHeight: 14.9, pixelSize: 4.3 }),
    );
  });

  it('hides manual telescope form when cancel is clicked', () => {
    render(<EquipmentStep />);
    const manualBtns = screen.getAllByText('setupWizard.steps.equipment.manualInput');
    fireEvent.click(manualBtns[0]);
    expect(screen.getByLabelText(/fov.focalLength/)).toBeInTheDocument();

    // Click cancel (now shows "Cancel" text)
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByLabelText(/fov.focalLength/)).not.toBeInTheDocument();
  });
});
