/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SkyMarkers } from '../sky-markers';

const marker = {
  id: 'm1',
  name: 'Marker 1',
  description: 'test',
  ra: 10,
  dec: 20,
  raString: '00h 40m 00s',
  decString: '+20 00 00',
  color: '#ff0000',
  icon: 'star' as const,
  createdAt: 1000,
  updatedAt: 1000,
  visible: true,
};

const mockSetActiveMarker = jest.fn();
const mockToggleMarkerVisibility = jest.fn();
const mockRemoveMarker = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useMarkerStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      markers: [marker],
      showMarkers: true,
      showLabels: true,
      globalMarkerSize: 20,
      activeMarkerId: null,
      setActiveMarker: mockSetActiveMarker,
      toggleMarkerVisibility: mockToggleMarkerVisibility,
      removeMarker: mockRemoveMarker,
    }),
}));

jest.mock('@/lib/hooks', () => ({
  useBatchProjection: () => [{ item: marker, x: 100, y: 120, visible: true }],
}));

jest.mock('@/lib/constants/marker-icons', () => ({
  MarkerIconDisplay: {
    star: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="marker-icon" {...props} />,
  },
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ContextMenuContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ContextMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button onClick={onSelect}>{children}</button>
  ),
  ContextMenuSeparator: () => null,
  ContextMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ContextMenuLabel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('SkyMarkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders visual marker icon in default mode', () => {
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
      />
    );

    expect(screen.getByTestId('marker-icon')).toBeInTheDocument();
    expect(screen.getAllByText('Marker 1').length).toBeGreaterThan(0);
  });

  it('does not render icon in interactionOnly mode', () => {
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        interactionOnly
      />
    );

    expect(screen.queryByTestId('marker-icon')).not.toBeInTheDocument();
    expect(screen.getAllByText('Marker 1').length).toBeGreaterThan(0);
  });

  it('keeps interactions in interactionOnly mode', () => {
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        interactionOnly
      />
    );

    const clickable = document.querySelector('.cursor-pointer') as HTMLElement;
    fireEvent.click(clickable);
    expect(mockSetActiveMarker).toHaveBeenCalledWith('m1');
  });

  it('triggers onDoubleClick handler', () => {
    const onDoubleClick = jest.fn();
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        onMarkerDoubleClick={onDoubleClick}
      />
    );

    const clickable = document.querySelector('.cursor-pointer') as HTMLElement;
    fireEvent.doubleClick(clickable);
    expect(onDoubleClick).toHaveBeenCalledWith(marker);
  });

  it('triggers context menu edit action', () => {
    const onEdit = jest.fn();
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        onMarkerEdit={onEdit}
      />
    );

    // Context menu items are mocked as buttons
    fireEvent.click(screen.getByText('common.edit'));
    expect(onEdit).toHaveBeenCalledWith(marker);
  });

  it('triggers context menu delete action via callback', () => {
    const onDelete = jest.fn();
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        onMarkerDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('common.delete'));
    expect(onDelete).toHaveBeenCalledWith(marker);
  });

  it('falls back to removeMarker from store when no onMarkerDelete', () => {
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
      />
    );

    fireEvent.click(screen.getByText('common.delete'));
    expect(mockRemoveMarker).toHaveBeenCalledWith('m1');
  });

  it('triggers context menu navigate action', () => {
    const onNavigate = jest.fn();
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        onMarkerNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByText('markers.goTo'));
    expect(onNavigate).toHaveBeenCalledWith(marker);
  });

  it('triggers context menu toggle visibility action', () => {
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
      />
    );

    // marker is visible, so clicking should show "hide"
    fireEvent.click(screen.getByText('markers.hide'));
    expect(mockToggleMarkerVisibility).toHaveBeenCalledWith('m1');
  });

  it('triggers onClick callback', () => {
    const onClick = jest.fn();
    render(
      <SkyMarkers
        containerWidth={800}
        containerHeight={600}
        onMarkerClick={onClick}
      />
    );

    const clickable = document.querySelector('.cursor-pointer') as HTMLElement;
    fireEvent.click(clickable);
    expect(onClick).toHaveBeenCalledWith(marker);
  });
});
