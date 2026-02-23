/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CompleteStep } from '../complete-step';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('CompleteStep', () => {
  it('renders description text', () => {
    render(<CompleteStep />);
    expect(screen.getByText('setupWizard.steps.complete.description')).toBeInTheDocument();
  });

  it('renders ready to explore badge', () => {
    render(<CompleteStep />);
    expect(screen.getByText('setupWizard.steps.complete.readyToExplore')).toBeInTheDocument();
  });

  it('renders quick tips', () => {
    render(<CompleteStep />);
    expect(screen.getByText('setupWizard.steps.complete.quickTips')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.complete.tip1')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.complete.tip2')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.complete.tip3')).toBeInTheDocument();
  });
});
