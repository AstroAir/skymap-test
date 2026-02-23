/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TargetDetailDialog } from '../target-detail-dialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useTargetListStore: jest.fn(() => ({
    updateTarget: jest.fn(),
  })),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick} {...props}>{children}</button>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <div />,
}));

describe('TargetDetailDialog', () => {
  it('renders nothing when target is null', () => {
    const { container } = render(<TargetDetailDialog target={null} open={true} onOpenChange={jest.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('does not render when closed', () => {
    const target = { id: 't1', name: 'M31', ra: 10.68, dec: 41.26, raString: '00h 42m', decString: "+41° 16'", priority: 'medium' as const, status: 'planned' as const, notes: '', tags: [] as string[], addedAt: Date.now(), type: 'Galaxy', isFavorite: false, isArchived: false };
    render(<TargetDetailDialog target={target} open={false} onOpenChange={jest.fn()} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
});
