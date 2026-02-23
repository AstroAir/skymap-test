/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => open ? <div data-testid="dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
}));

import { CloseConfirmDialog } from '../close-confirm-dialog';

describe('CloseConfirmDialog', () => {
  it('renders when open', () => {
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CloseConfirmDialog open={false} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirmed', () => {
    const onConfirm = jest.fn();
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={onConfirm} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onConfirm).toHaveBeenCalled();
  });
});
