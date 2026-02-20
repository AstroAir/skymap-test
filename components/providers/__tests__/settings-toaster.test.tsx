/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const settingsState = {
  notifications: {
    enableToasts: true,
    toastDuration: 4500,
  },
};

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: (selector: (state: typeof settingsState) => unknown) => selector(settingsState),
}));

jest.mock('sonner', () => ({
  Toaster: ({ duration }: { duration?: number }) => (
    <div data-testid="toaster" data-duration={duration} />
  ),
}));

import { SettingsToaster } from '../settings-toaster';

describe('SettingsToaster', () => {
  it('renders Toaster when notifications are enabled', () => {
    settingsState.notifications.enableToasts = true;
    settingsState.notifications.toastDuration = 4500;

    render(<SettingsToaster />);

    const toaster = screen.getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveAttribute('data-duration', '4500');
  });

  it('does not render Toaster when notifications are disabled', () => {
    settingsState.notifications.enableToasts = false;

    const { container } = render(<SettingsToaster />);

    expect(container).toBeEmptyDOMElement();
  });
});

