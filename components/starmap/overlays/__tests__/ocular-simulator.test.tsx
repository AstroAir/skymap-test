/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OcularSimulator } from '../ocular-simulator';

const mockSetOcularDisplay = jest.fn();
const mockUseEquipmentStore = jest.fn();
const mockUseOcularSimulation = jest.fn();

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/stores', () => ({
  useEquipmentStore: (selector: (state: Record<string, unknown>) => unknown) => mockUseEquipmentStore(selector),
}));

jest.mock('@/lib/hooks/use-ocular-simulation', () => ({
  useOcularSimulation: () => mockUseOcularSimulation(),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: () => <div data-testid="slider" />,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (value: boolean) => void }) => (
    <button onClick={() => onCheckedChange(!checked)}>{checked ? 'on' : 'off'}</button>
  ),
}));
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <div>value</div>,
}));

describe('OcularSimulator', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEquipmentStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) => selector({
      addCustomEyepiece: jest.fn(),
      addCustomBarlow: jest.fn(),
      addCustomOcularTelescope: jest.fn(),
      removeCustomEyepiece: jest.fn(),
      removeCustomBarlow: jest.fn(),
      removeCustomOcularTelescope: jest.fn(),
      ocularDisplay: { enabled: false, opacity: 70, showCrosshair: true, appliedFov: null },
      setOcularDisplay: mockSetOcularDisplay,
    }));

    mockUseOcularSimulation.mockReturnValue({
      telescopes: [{ id: 't1', name: 'Scope', focalLength: 400, aperture: 80, type: 'refractor', source: 'builtin' }],
      eyepieces: [{ id: 'e1', name: 'EP', focalLength: 25, afov: 52, source: 'builtin' }],
      barlows: [{ id: 'b0', name: 'None', magnification: 1, source: 'builtin' }],
      selectedOcularTelescopeId: 't1',
      selectedEyepieceId: 'e1',
      selectedBarlowId: 'b0',
      selectedTelescope: { id: 't1', name: 'Scope', focalLength: 400, aperture: 80, type: 'refractor', source: 'builtin' },
      selectedEyepiece: { id: 'e1', name: 'EP', focalLength: 25, afov: 52, source: 'builtin' },
      selectedBarlow: { id: 'b0', name: 'None', magnification: 1, source: 'builtin' },
      setSelectedOcularTelescopeId: jest.fn(),
      setSelectedEyepieceId: jest.fn(),
      setSelectedBarlowId: jest.fn(),
      viewData: {
        magnification: 16,
        tfov: 1.23,
        exitPupil: 5,
        dawesLimit: 1.4,
        rayleighLimit: 1.7,
        maxUsefulMag: 160,
        minUsefulMag: 12,
        bestPlanetaryMag: 120,
        focalRatio: 5,
        lightGathering: 130,
        limitingMag: 11.5,
        surfaceBrightness: 0.5,
        isOverMagnified: false,
        isUnderMagnified: false,
        effectiveFocalLength: 400,
        observingSuggestion: 'allround',
      },
      hasDesktopSource: false,
    });
  });

  it('applies ocular tfov to map when apply button is clicked', () => {
    const onApplyFov = jest.fn();
    render(<OcularSimulator onApplyFov={onApplyFov} currentFov={4.2} />);

    fireEvent.click(screen.getByText('ocular.applyToMap'));

    expect(onApplyFov).toHaveBeenCalledWith(1.23);
    expect(mockSetOcularDisplay).toHaveBeenCalledWith({ enabled: true, appliedFov: 1.23 });
  });

  it('does not show delete button for non-custom selection', () => {
    render(<OcularSimulator />);
    expect(screen.queryByLabelText('ocular.deleteCustom')).not.toBeInTheDocument();
  });

  it('disables save button when custom input is invalid', () => {
    render(<OcularSimulator />);

    fireEvent.click(screen.getAllByText('ocular.addCustom')[0]);

    const saveButton = screen.getByText('common.save');
    expect(saveButton).toBeDisabled();
  });
});
