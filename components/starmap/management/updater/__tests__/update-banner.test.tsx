/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseUpdater = jest.fn();

jest.mock('@/lib/tauri/updater-hooks', () => ({
  useUpdater: () => mockUseUpdater(),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { UpdateBanner } from '../update-banner';

const renderComponent = (props?: { onOpenDialog?: () => void; className?: string }) => {
  return render(<UpdateBanner {...props} />);
};

describe('UpdateBanner', () => {
  const defaultMockReturn = {
    hasUpdate: false,
    updateInfo: null,
    dismissUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdater.mockReturnValue(defaultMockReturn);
  });

  it('should not render when no update is available', () => {
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('should render banner when update is available', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
    });

    renderComponent();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('should call onOpenDialog when update button is clicked', () => {
    const onOpenDialog = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
    });

    renderComponent({ onOpenDialog });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(onOpenDialog).toHaveBeenCalled();
  });

  it('should call dismissUpdate when dismiss button is clicked', () => {
    const dismissUpdate = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
      dismissUpdate,
    });

    renderComponent();

    const buttons = screen.getAllByRole('button');
    // Dismiss is usually the second button
    fireEvent.click(buttons[1]);

    expect(dismissUpdate).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
    });

    const { container } = renderComponent({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should not render when updateInfo is null even if hasUpdate is true', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: null,
    });

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });
});
