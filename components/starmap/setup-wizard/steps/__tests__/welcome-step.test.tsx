/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { WelcomeStep } from '../welcome-step';

describe('WelcomeStep', () => {
  it('renders without crashing', () => {
    render(<WelcomeStep />);
  });

  it('renders welcome description', () => {
    render(<WelcomeStep />);
    expect(screen.getByText('setupWizard.steps.welcome.description')).toBeInTheDocument();
  });
});
