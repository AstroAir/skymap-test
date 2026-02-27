/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyKnowledgeButton } from '../daily-knowledge-button';

const mockOpenDialog = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useDailyKnowledgeStore: jest.fn((selector) => {
    const state = { openDialog: mockOpenDialog };
    return selector(state);
  }),
}));

describe('DailyKnowledgeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button with correct aria-label', () => {
    render(<DailyKnowledgeButton />);
    const button = screen.getByRole('button', { name: 'dailyKnowledge.open' });
    expect(button).toBeInTheDocument();
  });

  it('renders the BookOpen icon', () => {
    render(<DailyKnowledgeButton />);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls openDialog with manual on click', () => {
    render(<DailyKnowledgeButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOpenDialog).toHaveBeenCalledWith('manual');
  });

  it('applies custom className', () => {
    render(<DailyKnowledgeButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('has data-tour-id attribute', () => {
    render(<DailyKnowledgeButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-tour-id', 'daily-knowledge');
  });

  it('has title attribute matching aria-label', () => {
    render(<DailyKnowledgeButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'dailyKnowledge.open');
  });
});
