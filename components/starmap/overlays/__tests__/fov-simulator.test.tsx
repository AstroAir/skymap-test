/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: { value?: number[]; onValueChange?: (v: number[]) => void }) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      data-testid="slider"
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span>Select...</span>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} data-testid="switch" />
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

import { FOVSimulator, type GridType } from '../fov-simulator';

describe('FOVSimulator', () => {
  const defaultMosaic = {
    enabled: false,
    rows: 2,
    cols: 2,
    overlap: 10,
    overlapUnit: 'percent' as const,
  };

  const defaultProps = {
    enabled: true,
    onEnabledChange: jest.fn(),
    sensorWidth: 36,
    sensorHeight: 24,
    focalLength: 1000,
    pixelSize: 4.5,
    rotationAngle: 0,
    onSensorWidthChange: jest.fn(),
    onSensorHeightChange: jest.fn(),
    onFocalLengthChange: jest.fn(),
    onPixelSizeChange: jest.fn(),
    onRotationAngleChange: jest.fn(),
    mosaic: defaultMosaic,
    onMosaicChange: jest.fn(),
    gridType: 'none' as GridType,
    onGridTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FOVSimulator {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders dialog trigger', () => {
    render(<FOVSimulator {...defaultProps} />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
  });

  it('renders trigger button', () => {
    render(<FOVSimulator {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders enabled switch', () => {
    render(<FOVSimulator {...defaultProps} />);
    const switches = screen.getAllByTestId('switch');
    expect(switches.length).toBeGreaterThan(0);
  });

  it('renders calculated FOV values', () => {
    render(<FOVSimulator {...defaultProps} />);
    // Should contain calculated FOV text
    expect(document.body.textContent).toContain('fov.fieldWidth');
    expect(document.body.textContent).toContain('fov.fieldHeight');
  });

  it('renders sensor preset tabs', () => {
    render(<FOVSimulator {...defaultProps} />);
    // The preset tab labels
    expect(screen.getByText('Full Frame')).toBeInTheDocument();
    expect(screen.getByText('APS-C')).toBeInTheDocument();
    expect(screen.getByText('ZWO')).toBeInTheDocument();
  });

  it('renders manual input fields', () => {
    render(<FOVSimulator {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThanOrEqual(3); // sensorWidth, sensorHeight, pixelSize
  });

  it('renders rotation slider', () => {
    render(<FOVSimulator {...defaultProps} />);
    const sliders = screen.getAllByTestId('slider');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('renders mosaic tab content', () => {
    render(<FOVSimulator {...defaultProps} />);
    expect(document.body.textContent).toContain('fov.enableMosaic');
  });

  it('renders display tab content', () => {
    render(<FOVSimulator {...defaultProps} />);
    expect(document.body.textContent).toContain('fov.compositionGrid');
  });

  it('renders close button', () => {
    render(<FOVSimulator {...defaultProps} />);
    expect(screen.getByText('common.close')).toBeInTheDocument();
  });

  it('renders with disabled state', () => {
    render(<FOVSimulator {...defaultProps} enabled={false} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<FOVSimulator {...defaultProps} />);
    // Copy/Check icons are in a button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('calls onSensorWidthChange when sensor width input changes', () => {
    render(<FOVSimulator {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    // First numeric input is sensor width
    fireEvent.change(inputs[0], { target: { value: '23.5' } });
    expect(defaultProps.onSensorWidthChange).toHaveBeenCalledWith(23.5);
  });

  it('calls onSensorHeightChange when sensor height input changes', () => {
    render(<FOVSimulator {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '15.6' } });
    expect(defaultProps.onSensorHeightChange).toHaveBeenCalledWith(15.6);
  });

  it('calls onFocalLengthChange when focal length input changes', () => {
    render(<FOVSimulator {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    // focal length input is in optics tab
    const flInput = inputs.find(i => Number(i.getAttribute('value')) === 1000);
    if (flInput) {
      fireEvent.change(flInput, { target: { value: '800' } });
      expect(defaultProps.onFocalLengthChange).toHaveBeenCalledWith(800);
    }
  });

  it('calls onFocalLengthChange when quick focal length button is clicked', () => {
    render(<FOVSimulator {...defaultProps} />);
    // Quick buttons: 200, 400, 600, 1000, 2000
    const btn200 = screen.getByText('200');
    fireEvent.click(btn200);
    expect(defaultProps.onFocalLengthChange).toHaveBeenCalledWith(200);
  });

  it('applies sensor preset when preset button clicked', () => {
    render(<FOVSimulator {...defaultProps} />);
    // Sensor presets render as buttons with name text
    const presetButtons = screen.getAllByRole('button');
    // Find a preset button that contains a sensor dimension text
    const sensorPreset = presetButtons.find(b => b.textContent?.includes('×') && b.textContent?.includes('mm'));
    if (sensorPreset) {
      fireEvent.click(sensorPreset);
      expect(defaultProps.onSensorWidthChange).toHaveBeenCalled();
      expect(defaultProps.onSensorHeightChange).toHaveBeenCalled();
    }
  });

  it('applies telescope preset when preset button clicked', () => {
    render(<FOVSimulator {...defaultProps} />);
    // Telescope presets contain "mm | f/" text
    const presetButtons = screen.getAllByRole('button');
    const telescopePreset = presetButtons.find(b => b.textContent?.includes('f/'));
    if (telescopePreset) {
      fireEvent.click(telescopePreset);
      expect(defaultProps.onFocalLengthChange).toHaveBeenCalled();
    }
  });

  it('handles rotation reset click', () => {
    render(<FOVSimulator {...defaultProps} />);
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    expect(defaultProps.onRotationAngleChange).toHaveBeenCalledWith(0);
  });

  it('handles rotation slider change', () => {
    render(<FOVSimulator {...defaultProps} />);
    const sliders = screen.getAllByTestId('slider');
    // First slider is rotation
    fireEvent.change(sliders[0], { target: { value: '45' } });
    expect(defaultProps.onRotationAngleChange).toHaveBeenCalledWith(45);
  });

  it('handles mosaic switch toggle', () => {
    render(<FOVSimulator {...defaultProps} />);
    const switches = screen.getAllByTestId('switch');
    // The mosaic switch is the second checkbox (first is enabled toggle)
    if (switches.length >= 2) {
      fireEvent.click(switches[1]);
      expect(defaultProps.onMosaicChange).toHaveBeenCalled();
    }
  });

  it('handles copy to clipboard', () => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    
    render(<FOVSimulator {...defaultProps} />);
    // Find the copy button (small icon button in header)
    const buttons = screen.getAllByRole('button');
    // The copy button is a small ghost button in the dialog header
    const copyBtn = buttons.find(b => b.className?.includes('h-7 w-7'));
    if (copyBtn) {
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('handles pixel size input change', () => {
    render(<FOVSimulator {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    // pixel size is the 3rd numeric input
    fireEvent.change(inputs[2], { target: { value: '5.0' } });
    expect(defaultProps.onPixelSizeChange).toHaveBeenCalledWith(5);
  });

  it('closes dialog when close button clicked', () => {
    render(<FOVSimulator {...defaultProps} />);
    const closeBtn = screen.getByText('common.close');
    fireEvent.click(closeBtn);
    // Dialog close is handled internally; just ensure no crash
    expect(closeBtn).toBeInTheDocument();
  });

  it('toggles enabled switch', () => {
    render(<FOVSimulator {...defaultProps} />);
    const switches = screen.getAllByTestId('switch');
    // First switch is the enabled toggle
    fireEvent.click(switches[0]);
    expect(defaultProps.onEnabledChange).toHaveBeenCalled();
  });

  it('renders all quick focal length buttons', () => {
    render(<FOVSimulator {...defaultProps} />);
    [200, 400, 600, 1000, 2000].forEach(fl => {
      expect(screen.getByText(String(fl))).toBeInTheDocument();
    });
  });

  it('clicks multiple focal length quick buttons', () => {
    render(<FOVSimulator {...defaultProps} />);
    fireEvent.click(screen.getByText('400'));
    expect(defaultProps.onFocalLengthChange).toHaveBeenCalledWith(400);
    fireEvent.click(screen.getByText('2000'));
    expect(defaultProps.onFocalLengthChange).toHaveBeenCalledWith(2000);
  });

  it('handles overlap slider change for mosaic', () => {
    render(<FOVSimulator {...defaultProps} mosaic={{ ...defaultProps.mosaic, enabled: true }} />);
    const sliders = screen.getAllByTestId('slider');
    // The overlap slider
    const overlapSlider = sliders.find((_, i) => i >= 1);
    if (overlapSlider) {
      fireEvent.change(overlapSlider, { target: { value: '20' } });
      expect(defaultProps.onMosaicChange).toHaveBeenCalled();
    }
  });
});
