/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  common: {
    loading: 'Loading',
  },
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('Spinner', () => {
  it('renders correctly with default props', () => {
    renderWithProviders(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'loading');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies custom className', () => {
    renderWithProviders(<Spinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('passes additional props to the svg', () => {
    renderWithProviders(<Spinner data-testid="test-spinner" id="spinner-id" />);
    const spinner = screen.getByTestId('test-spinner');
    expect(spinner).toHaveAttribute('id', 'spinner-id');
  });
});
