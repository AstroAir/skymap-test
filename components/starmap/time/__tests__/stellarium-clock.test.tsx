/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';

// Mock dependencies before importing component
const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: null,
    isReady: true,
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
}));

// Mock utils
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  mjdToUTC: jest.fn(() => new Date()),
  utcToMJD: jest.fn(() => 0),
  formatDateForInput: jest.fn(() => '2024-01-01'),
  formatTimeForInput: jest.fn(() => '12:00:00'),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value: number[]; onValueChange: (v: number[]) => void }) => (
    <input type="range" value={value?.[0] || 0} onChange={(e) => onValueChange?.([Number(e.target.value)])} data-testid="slider" />
  ),
}));

import { StellariumClock } from '../stellarium-clock';

describe('StellariumClock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<StellariumClock />);
    expect(document.body).toBeInTheDocument();
  });
});


