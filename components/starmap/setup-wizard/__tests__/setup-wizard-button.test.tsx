/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupWizardButton } from '../setup-wizard-button';

const mockOpenWizard = jest.fn();
const mockResetSetup = jest.fn();

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores/setup-wizard-store', () => ({
  useSetupWizardStore: jest.fn((selector) => {
    const state = { openWizard: mockOpenWizard, resetSetup: mockResetSetup };
    return selector(state);
  }),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('SetupWizardButton', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('renders the button text', () => {
    render(<SetupWizardButton />);
    expect(screen.getByText('setupWizard.restartSetup')).toBeInTheDocument();
  });

  it('calls resetSetup and openWizard on click', () => {
    render(<SetupWizardButton />);
    fireEvent.click(screen.getByText('setupWizard.restartSetup'));
    expect(mockResetSetup).toHaveBeenCalled();
    expect(mockOpenWizard).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<SetupWizardButton className="my-btn" />);
    const btn = screen.getByText('setupWizard.restartSetup').closest('button');
    expect(btn?.className).toContain('my-btn');
  });
});
