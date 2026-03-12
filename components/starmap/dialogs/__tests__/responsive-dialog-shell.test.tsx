/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '../responsive-dialog-shell';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches,
      media: '(max-width: 640px)',
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    onOpenChange,
  }: React.PropsWithChildren<{ onOpenChange?: (open: boolean) => void }>) => (
    <div data-testid="dialog-root">
      <button data-testid="dialog-close-action" onClick={() => onOpenChange?.(false)}>
        close
      </button>
      {children}
    </div>
  ),
  DialogTrigger: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
  DialogContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="dialog-content" data-classname={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="dialog-footer" data-classname={className}>
      {children}
    </div>
  ),
  DialogClose: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
}));

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    children,
    onOpenChange,
  }: React.PropsWithChildren<{ onOpenChange?: (open: boolean) => void }>) => (
    <div data-testid="drawer-root">
      <button data-testid="drawer-close-action" onClick={() => onOpenChange?.(false)}>
        close
      </button>
      {children}
    </div>
  ),
  DrawerTrigger: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
  DrawerContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="drawer-content" data-classname={className}>
      {children}
    </div>
  ),
  DrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DrawerFooter: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="drawer-footer" data-classname={className}>
      {children}
    </div>
  ),
  DrawerClose: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
}));

describe('ResponsiveDialogShell', () => {
  it('uses desktop dialog by default', () => {
    mockMatchMedia(false);
    render(
      <ResponsiveDialog open={true} onOpenChange={jest.fn()} tier="standard-form">
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Desktop</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-root')).not.toBeInTheDocument();
  });

  it('uses mobile drawer when viewport is mobile', () => {
    mockMatchMedia(true);
    render(
      <ResponsiveDialog open={true} onOpenChange={jest.fn()} tier="standard-form">
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Mobile</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    expect(screen.getByTestId('drawer-root')).toBeInTheDocument();
    expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
  });

  it('keeps desktop dialog for custom tier even on mobile viewport', () => {
    mockMatchMedia(true);
    render(
      <ResponsiveDialog open={true} onOpenChange={jest.fn()} tier="custom">
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Custom</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-root')).not.toBeInTheDocument();
  });

  it('routes close interactions through one onOpenChange path', () => {
    mockMatchMedia(true);
    const onOpenChange = jest.fn();
    render(
      <ResponsiveDialog open={true} onOpenChange={onOpenChange} tier="standard-form">
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Close</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    fireEvent.click(screen.getByTestId('drawer-close-action'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies sticky mobile footer class only on mobile', () => {
    mockMatchMedia(true);
    const { unmount } = render(
      <ResponsiveDialog open={true} onOpenChange={jest.fn()}>
        <ResponsiveDialogContent>
          <ResponsiveDialogFooter stickyOnMobile>Actions</ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
    expect(screen.getByTestId('drawer-footer').getAttribute('data-classname')).toContain('sticky');

    unmount();
    mockMatchMedia(false);
    render(
      <ResponsiveDialog open={true} onOpenChange={jest.fn()}>
        <ResponsiveDialogContent>
          <ResponsiveDialogFooter stickyOnMobile>Actions</ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
    expect(
      screen.getByTestId('dialog-footer').getAttribute('data-classname') ?? ''
    ).not.toContain('sticky');
  });
});
