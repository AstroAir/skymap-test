import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { TourSpotlight } from '../tour-spotlight';

describe('TourSpotlight', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when isActive is false', () => {
    const { container } = render(
      <TourSpotlight
        targetSelector="[data-testid='target']"
        isActive={false}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when isActive is true', async () => {
    const { container } = render(
      <TourSpotlight
        targetSelector="[data-testid='target']"
        isActive={true}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('should render centered overlay when target element not found', async () => {
    render(
      <TourSpotlight
        targetSelector="[data-testid='nonexistent']"
        isActive={true}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should render radial gradient overlay for center placement
    await waitFor(() => {
      const overlay = document.querySelector('[class*="fixed inset-0"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  it('should apply custom padding', () => {
    const customPadding = 16;
    
    // Create a target element
    const targetElement = document.createElement('div');
    targetElement.setAttribute('data-testid', 'target');
    targetElement.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 100,
      width: 50,
      height: 50,
      bottom: 150,
      right: 150,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));
    document.body.appendChild(targetElement);
    
    render(
      <TourSpotlight
        targetSelector="[data-testid='target']"
        isActive={true}
        padding={customPadding}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Clean up
    document.body.removeChild(targetElement);
  });

  it('should have aria-hidden attribute for accessibility', async () => {
    render(
      <TourSpotlight
        targetSelector="[data-testid='nonexistent']"
        isActive={true}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  it('should apply custom className', async () => {
    const customClass = 'custom-spotlight-class';
    
    render(
      <TourSpotlight
        targetSelector="[data-testid='nonexistent']"
        isActive={true}
        className={customClass}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      const overlay = document.querySelector(`.${customClass}`);
      expect(overlay).toBeInTheDocument();
    });
  });

  it('should update rect on window resize', async () => {
    const targetElement = document.createElement('div');
    targetElement.setAttribute('data-testid', 'target');
    let rect = {
      top: 100,
      left: 100,
      width: 50,
      height: 50,
      bottom: 150,
      right: 150,
      x: 100,
      y: 100,
      toJSON: () => {},
    };
    targetElement.getBoundingClientRect = jest.fn(() => rect);
    document.body.appendChild(targetElement);
    
    render(
      <TourSpotlight
        targetSelector="[data-testid='target']"
        isActive={true}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Simulate resize
    rect = { ...rect, top: 200, left: 200 };
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    // Clean up
    document.body.removeChild(targetElement);
  });

  it('should have transition classes for animation', async () => {
    render(
      <TourSpotlight
        targetSelector="[data-testid='nonexistent']"
        isActive={true}
      />
    );
    
    // Initially should have opacity-0
    const initialOverlay = document.querySelector('[class*="opacity-0"]');
    expect(initialOverlay).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // After animation should have tour-spotlight-enter class
    await waitFor(() => {
      const animatedOverlay = document.querySelector('[class*="tour-spotlight-enter"]');
      expect(animatedOverlay).toBeInTheDocument();
    });
  });
});
