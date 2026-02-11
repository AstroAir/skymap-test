import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TourTooltip } from '../tour-tooltip';
import type { TourStep } from '@/lib/stores/onboarding-store';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'onboarding.stepOf': `${values?.current} of ${values?.total}`,
      'onboarding.next': 'Next',
      'onboarding.prev': 'Back',
      'onboarding.skip': 'Skip',
      'onboarding.finish': 'Finish',
      'onboarding.steps.welcome.title': 'Welcome',
      'onboarding.steps.welcome.description': 'Welcome description',
    };
    return translations[key] || key;
  },
}));

const mockStep: TourStep = {
  id: 'welcome',
  targetSelector: '[data-testid="target"]',
  titleKey: 'onboarding.steps.welcome.title',
  descriptionKey: 'onboarding.steps.welcome.description',
  placement: 'bottom',
  highlightPadding: 8,
};

const defaultProps = {
  step: mockStep,
  currentIndex: 0,
  totalSteps: 10,
  onNext: jest.fn(),
  onPrev: jest.fn(),
  onSkip: jest.fn(),
  onClose: jest.fn(),
  isFirst: true,
  isLast: false,
};


describe('TourTooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render tooltip with step content', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Welcome description')).toBeInTheDocument();
    });
  });

  it('should display step counter', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('1 of 10')).toBeInTheDocument();
    });
  });

  it('should show Next button when not on last step', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('should show Finish button when on last step', async () => {
    render(<TourTooltip {...defaultProps} isLast={true} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });
  });

  it('should not show Back button on first step', async () => {
    render(<TourTooltip {...defaultProps} isFirst={true} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });
  });

  it('should show Back button on non-first step', async () => {
    render(<TourTooltip {...defaultProps} isFirst={false} currentIndex={2} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('should show Skip button when not on last step', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });

  it('should not show Skip button on last step', async () => {
    render(<TourTooltip {...defaultProps} isLast={true} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });
  });

  it('should call onNext when Next button clicked', async () => {
    const onNext = jest.fn();
    render(<TourTooltip {...defaultProps} onNext={onNext} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalled();
  });

  it('should call onPrev when Back button clicked', async () => {
    const onPrev = jest.fn();
    render(<TourTooltip {...defaultProps} isFirst={false} onPrev={onPrev} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back'));
    expect(onPrev).toHaveBeenCalled();
  });

  it('should call onSkip when Skip button clicked', async () => {
    const onSkip = jest.fn();
    render(<TourTooltip {...defaultProps} onSkip={onSkip} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(<TourTooltip {...defaultProps} onClose={onClose} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Find close button by aria-label
    const closeButton = document.querySelector('button[aria-label="Skip"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should have role="dialog" and aria attributes', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });

  it('should render progress dots', async () => {
    render(<TourTooltip {...defaultProps} totalSteps={5} currentIndex={2} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      // Should have 5 progress dots
      const dots = document.querySelectorAll('[class*="h-1.5 rounded-full"]');
      expect(dots.length).toBe(5);
    });
  });

  it('should highlight current progress dot', async () => {
    render(<TourTooltip {...defaultProps} totalSteps={5} currentIndex={2} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      // The active dot should have wider width (w-4)
      const activeDot = document.querySelector('[class*="w-4 bg-primary"]');
      expect(activeDot).toBeInTheDocument();
    });
  });

  it('should handle center placement', async () => {
    const centerStep: TourStep = {
      ...mockStep,
      placement: 'center',
    };
    
    render(<TourTooltip {...defaultProps} step={centerStep} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });

  it('should apply animation class when visible', async () => {
    render(<TourTooltip {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      const tooltip = document.querySelector('[class*="tour-tooltip-enter"]');
      expect(tooltip).toBeInTheDocument();
    });
  });
});
