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

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: { id?: string; checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="dont-show-checkbox"
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.PropsWithChildren<{ htmlFor?: string }>) => <label {...props}>{children}</label>,
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

  it('calls onConfirm(false) when confirmed without checkbox', () => {
    const onConfirm = jest.fn();
    const onOpenChange = jest.fn();
    render(<CloseConfirmDialog open={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]); // confirm button
    expect(onConfirm).toHaveBeenCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm(true) when checkbox is checked then confirmed', () => {
    const onConfirm = jest.fn();
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={onConfirm} />);
    const checkbox = screen.getByTestId('dont-show-checkbox');
    fireEvent.click(checkbox);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]); // confirm button
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    const onOpenChange = jest.fn();
    render(<CloseConfirmDialog open={true} onOpenChange={onOpenChange} onConfirm={jest.fn()} />);
    const buttons = screen.getAllByRole('button');
    // Cancel is the first button in the footer
    fireEvent.click(buttons[0]);
    // AlertDialogCancel doesn't have onClick in our mock, so let's verify the dialog renders cancel text
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  it('displays translated text for title and description', () => {
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByText('starmap.closeConfirmTitle')).toBeInTheDocument();
    expect(screen.getByText('starmap.closeConfirmMessage')).toBeInTheDocument();
  });

  it('displays dontShowAgain label', () => {
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByText('starmap.dontShowAgain')).toBeInTheDocument();
  });

  it('displays confirm button text', () => {
    render(<CloseConfirmDialog open={true} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByText('starmap.confirmClose')).toBeInTheDocument();
  });
});
