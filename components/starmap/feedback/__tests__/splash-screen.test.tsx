/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress" data-value={value} role="progressbar" aria-valuenow={value}>
      {value}%
    </div>
  ),
}));

// Mock reduced motion hook — default to no reduced motion
let mockReducedMotion = false;
jest.mock('@/lib/hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReducedMotion,
}));

import { SplashScreen } from '../splash-screen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with correct accessibility attributes', () => {
    render(<SplashScreen />);
    const splash = screen.getByTestId('splash-screen');
    expect(splash).toBeInTheDocument();
    expect(splash).toHaveAttribute('role', 'status');
    expect(splash).toHaveAttribute('aria-live', 'polite');
    expect(splash).toHaveAttribute('aria-busy', 'true');
  });

  it('calls onComplete after animation completes', async () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={100} />);
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it('respects custom minDuration', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={5000} />);
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows progress bar during loading phase', () => {
    render(<SplashScreen />);
    
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('can be skipped by clicking', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={5000} />);
    
    const splash = screen.getByTestId('splash-screen');
    fireEvent.click(splash);
    
    // After fade-out delay (400ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('can be skipped by pressing Escape', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={5000} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('completes faster with reduced motion preference', () => {
    mockReducedMotion = true;
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} minDuration={2500} />);
    
    // Should complete within 1000ms (capped) for reduced motion
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    expect(onComplete).toHaveBeenCalled();
  });
});
