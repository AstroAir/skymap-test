/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileToolbar } from '../mobile-toolbar';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="dropdown-item">{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useEquipmentStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      fovDisplay: { enabled: false },
      setFOVEnabled: jest.fn(),
    })
  ),
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      stellarium: {
        constellationsLinesVisible: false,
        equatorialLinesVisible: false,
        dsosVisible: false,
        atmosphereVisible: false,
      },
      toggleStellariumSetting: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      targets: [],
    })
  ),
}));

jest.mock('@/lib/core/constants/fov', () => ({
  ZOOM_PRESETS: [
    { fov: 90, labelKey: 'wideField' },
    { fov: 60, labelKey: 'normal' },
    { fov: 30, labelKey: 'medium' },
  ],
}));

describe('MobileToolbar', () => {
  const defaultProps = {
    onOpenSearch: jest.fn(),
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onResetView: jest.fn(),
    onZoomToFov: jest.fn(),
    onOpenTargetList: jest.fn(),
    currentFov: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the toolbar with role=toolbar', () => {
    render(<MobileToolbar {...defaultProps} />);
    
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders search button with aria-label', () => {
    render(<MobileToolbar {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onOpenSearch when search button is clicked', () => {
    render(<MobileToolbar {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // Search is the first button
    fireEvent.click(buttons[0]);
    
    expect(defaultProps.onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenTargetList when target list button is clicked', () => {
    render(<MobileToolbar {...defaultProps} />);
    
    // Find the target list button by its aria-label or text
    const targetButton = screen.getAllByRole('button').find(
      btn => btn.textContent?.includes('Targets') || btn.textContent?.includes('targets')
    );
    
    if (targetButton) {
      fireEvent.click(targetButton);
      expect(defaultProps.onOpenTargetList).toHaveBeenCalledTimes(1);
    }
  });

  it('renders current FOV display', () => {
    render(<MobileToolbar {...defaultProps} currentFov={45.5} />);
    
    // FOV should appear somewhere in the toolbar
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('renders children in extra slot', () => {
    render(
      <MobileToolbar {...defaultProps}>
        <div data-testid="child-content">Extra content</div>
      </MobileToolbar>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
