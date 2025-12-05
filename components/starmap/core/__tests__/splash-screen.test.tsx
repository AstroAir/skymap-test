/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress" data-value={value} role="progressbar" aria-valuenow={value}>
      {value}%
    </div>
  ),
}));

import { SplashScreen } from '../splash-screen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<SplashScreen />);
    // SplashScreen should render
    expect(document.body).toBeInTheDocument();
  });

  it('calls onComplete after animation', async () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={100} />);
    
    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // onComplete should be called after animation
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it('respects custom minDuration', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={5000} />);
    
    // Advance less than minDuration
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // onComplete should not be called yet
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows progress bar during loading phase', () => {
    render(<SplashScreen />);
    
    // Advance to loading phase
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    
    // Progress bar should be visible
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });
});
