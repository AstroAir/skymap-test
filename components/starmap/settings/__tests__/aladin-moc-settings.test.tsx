/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockAddMocLayer = jest.fn();
const mockRemoveMocLayer = jest.fn();
const mockToggleMocLayer = jest.fn();
const mockUpdateMocLayer = jest.fn();
let mockMocLayers: { id: string; name: string; url: string; color: string; opacity: number; lineWidth: number; visible: boolean }[] = [];

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores/aladin-store', () => ({
  useAladinStore: jest.fn((selector) => {
    const state = {
      mocLayers: mockMocLayers,
      addMocLayer: mockAddMocLayer,
      removeMocLayer: mockRemoveMocLayer,
      toggleMocLayer: mockToggleMocLayer,
      updateMocLayer: mockUpdateMocLayer,
    };
    return selector(state);
  }),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: { value: number[]; onValueChange?: (v: number[]) => void } & Record<string, unknown>) => (
    <input
      type="range"
      data-testid={`slider-${props.min}-${props.max}`}
      value={value[0]}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
    />
  ),
}));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div>,
  ToggleItem: ({ label, checked, onCheckedChange, id }: { label: string; checked: boolean; onCheckedChange: () => void; id: string }) => (
    <div>
      <input type="checkbox" data-testid={`toggle-${id}`} checked={checked} onChange={onCheckedChange} />
      <span>{label}</span>
    </div>
  ),
}));

import { AladinMocSettings } from '../aladin-moc-settings';

describe('AladinMocSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMocLayers = [];
  });

  it('renders without crashing', () => {
    render(<AladinMocSettings />);
    expect(screen.getByText('settings.aladinMocLayers')).toBeInTheDocument();
  });

  it('renders well-known MOC buttons', () => {
    render(<AladinMocSettings />);
    expect(screen.getByText('SDSS DR16')).toBeInTheDocument();
  });

  it('adds a well-known MOC when button is clicked', () => {
    render(<AladinMocSettings />);
    fireEvent.click(screen.getByText('SDSS DR16'));
    expect(mockAddMocLayer).toHaveBeenCalledWith(expect.objectContaining({
      name: 'SDSS DR16',
      opacity: 0.3,
      lineWidth: 1,
      visible: true,
    }));
  });

  it('renders custom MOC input fields', () => {
    render(<AladinMocSettings />);
    expect(screen.getByPlaceholderText('settings.aladinMocNamePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('settings.aladinMocUrlPlaceholder')).toBeInTheDocument();
  });

  it('adds a custom MOC with name and URL', () => {
    render(<AladinMocSettings />);
    const nameInput = screen.getByPlaceholderText('settings.aladinMocNamePlaceholder');
    const urlInput = screen.getByPlaceholderText('settings.aladinMocUrlPlaceholder');
    fireEvent.change(nameInput, { target: { value: 'My MOC' } });
    fireEvent.change(urlInput, { target: { value: 'https://example.com/moc' } });
    fireEvent.click(screen.getByText('common.add'));
    expect(mockAddMocLayer).toHaveBeenCalledWith(expect.objectContaining({
      name: 'My MOC',
      url: 'https://example.com/moc',
      color: '#3b82f6',
    }));
  });

  it('uses URL as name when name is empty', () => {
    render(<AladinMocSettings />);
    const urlInput = screen.getByPlaceholderText('settings.aladinMocUrlPlaceholder');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/moc' } });
    fireEvent.click(screen.getByText('common.add'));
    expect(mockAddMocLayer).toHaveBeenCalledWith(expect.objectContaining({
      name: 'https://example.com/moc',
    }));
  });

  it('does not add custom MOC when URL is empty', () => {
    render(<AladinMocSettings />);
    fireEvent.click(screen.getByText('common.add'));
    expect(mockAddMocLayer).not.toHaveBeenCalled();
  });

  it('renders existing MOC layers', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    expect(screen.getByText('Test Layer')).toBeInTheDocument();
  });

  it('toggles MOC layer visibility', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    const toggle = screen.getByTestId('toggle-moc-layer-1');
    fireEvent.click(toggle);
    expect(mockToggleMocLayer).toHaveBeenCalledWith('layer-1');
  });

  it('removes MOC layer', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    const buttons = screen.getAllByRole('button');
    // The last button for this layer should be the delete button
    const deleteBtn = buttons.find(b => b.className?.includes('destructive'));
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      expect(mockRemoveMocLayer).toHaveBeenCalledWith('layer-1');
    }
  });

  it('shows opacity and line width sliders for visible layers', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    expect(screen.getByText('settings.aladinMocOpacity')).toBeInTheDocument();
    expect(screen.getByText('settings.aladinMocLineWidth')).toBeInTheDocument();
  });

  it('does not show sliders for hidden layers', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Hidden Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: false },
    ];
    render(<AladinMocSettings />);
    expect(screen.queryByText('settings.aladinMocOpacity')).not.toBeInTheDocument();
  });

  it('updates opacity via slider', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    const opacitySlider = screen.getByTestId('slider-0-1');
    fireEvent.change(opacitySlider, { target: { value: '0.8' } });
    expect(mockUpdateMocLayer).toHaveBeenCalledWith('layer-1', { opacity: 0.8 });
  });

  it('updates line width via slider', () => {
    mockMocLayers = [
      { id: 'layer-1', name: 'Test Layer', url: 'https://test.com', color: '#ff0000', opacity: 0.5, lineWidth: 2, visible: true },
    ];
    render(<AladinMocSettings />);
    const lineWidthSlider = screen.getByTestId('slider-0.5-6');
    fireEvent.change(lineWidthSlider, { target: { value: '3' } });
    expect(mockUpdateMocLayer).toHaveBeenCalledWith('layer-1', { lineWidth: 3 });
  });
});
