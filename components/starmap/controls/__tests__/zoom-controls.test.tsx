/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../zoom-controls';

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: { value: number[]; onValueChange: (v: number[]) => void }) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      data-testid="zoom-slider"
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ZoomControls', () => {
  const defaultProps = {
    fov: 60,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onFovChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders zoom in and zoom out buttons', () => {
    render(<ZoomControls {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('displays the current FOV value', () => {
    render(<ZoomControls {...defaultProps} fov={45.5} />);
    
    expect(screen.getByText('45.5°')).toBeInTheDocument();
  });

  it('displays FOV with 2 decimal places when less than 1', () => {
    render(<ZoomControls {...defaultProps} fov={0.75} />);
    
    expect(screen.getByText('0.75°')).toBeInTheDocument();
  });

  it('calls onZoomIn when zoom in button is clicked', () => {
    render(<ZoomControls {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // First button is zoom in
    
    expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom out button is clicked', () => {
    render(<ZoomControls {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Second button is zoom out
    
    expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('disables zoom in button when FOV is at minimum', () => {
    render(<ZoomControls {...defaultProps} fov={0.5} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('disables zoom out button when FOV is at maximum', () => {
    render(<ZoomControls {...defaultProps} fov={180} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDisabled();
  });

  it('renders the slider', () => {
    render(<ZoomControls {...defaultProps} />);
    
    expect(screen.getByTestId('zoom-slider')).toBeInTheDocument();
  });

  it('calls onFovChange when slider value changes', () => {
    render(<ZoomControls {...defaultProps} />);
    
    const slider = screen.getByTestId('zoom-slider');
    fireEvent.change(slider, { target: { value: '50' } });
    
    expect(defaultProps.onFovChange).toHaveBeenCalled();
  });

  it('has a group role with aria-label for zoom controls', () => {
    render(<ZoomControls {...defaultProps} />);

    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-label', 'zoom.zoomControls');
  });

  it('has aria-live="polite" on the FOV display', () => {
    render(<ZoomControls {...defaultProps} fov={45} />);

    const fovDisplay = screen.getByText('45.0°');
    expect(fovDisplay).toHaveAttribute('aria-live', 'polite');
    expect(fovDisplay).toHaveAttribute('aria-atomic', 'true');
  });

  it('does not disable either button when FOV is in mid-range', () => {
    render(<ZoomControls {...defaultProps} fov={30} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled(); // zoom in
    expect(buttons[1]).not.toBeDisabled(); // zoom out
  });

  it('displays integer FOV without extra decimals', () => {
    render(<ZoomControls {...defaultProps} fov={60} />);

    expect(screen.getByText('60.0°')).toBeInTheDocument();
  });
});
