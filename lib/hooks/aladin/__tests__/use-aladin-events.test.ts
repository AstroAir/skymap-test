/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useAladinEvents } from '../use-aladin-events';

describe('useAladinEvents', () => {
  const createMockAladin = () => ({
    on: jest.fn(),
    pix2world: jest.fn(() => [180, 45] as [number, number]),
    getRaDec: jest.fn(() => [180, 45] as [number, number]),
    getFov: jest.fn(() => [60, 60] as [number, number]),
  });

  const createContainer = () => {
    const div = document.createElement('div');
    div.getBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, right: 800, bottom: 600,
      width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}),
    }));
    return div;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not register events when engine is not ready', () => {
    const mockAladin = createMockAladin();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: false,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    expect(mockAladin.on).not.toHaveBeenCalled();
  });

  it('should register objectClicked event when engine is ready', () => {
    const mockAladin = createMockAladin();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    expect(mockAladin.on).toHaveBeenCalledWith('objectClicked', expect.any(Function));
  });

  it('should register click event for deselection', () => {
    const mockAladin = createMockAladin();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    const clickCalls = mockAladin.on.mock.calls.filter(
      (c: [string, unknown]) => c[0] === 'click'
    );
    expect(clickCalls.length).toBe(1);
  });

  it('should call onSelectionChange(null) when clicking empty space', () => {
    const mockAladin = createMockAladin();
    const onSelectionChange = jest.fn();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange,
        onContextMenu: jest.fn(),
      })
    );

    const clickHandler = mockAladin.on.mock.calls.find(
      (c: [string, unknown]) => c[0] === 'click'
    )?.[1] as (event: unknown) => void;
    expect(clickHandler).toBeDefined();

    // Click with no data → deselect
    clickHandler({ clientX: 100, clientY: 100 });
    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('should parse object data on objectClicked', () => {
    const mockAladin = createMockAladin();
    const onSelectionChange = jest.fn();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange,
        onContextMenu: jest.fn(),
      })
    );

    const objectClickedHandler = mockAladin.on.mock.calls.find(
      (c: [string, unknown]) => c[0] === 'objectClicked'
    )?.[1] as (obj: unknown) => void;
    expect(objectClickedHandler).toBeDefined();

    // Simulate object click
    objectClickedHandler({
      ra: 83.633,
      dec: 22.0145,
      data: { name: 'M1', type: 'nebula', mag: 8.4 },
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        names: ['M1'],
        raDeg: 83.633,
        decDeg: 22.0145,
        type: 'nebula',
        magnitude: 8.4,
      })
    );
  });

  it('should call onSelectionChange(null) when objectClicked with null', () => {
    const mockAladin = createMockAladin();
    const onSelectionChange = jest.fn();
    renderHook(() =>
      useAladinEvents({
        containerRef: { current: createContainer() },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange,
        onContextMenu: jest.fn(),
      })
    );

    const objectClickedHandler = mockAladin.on.mock.calls.find(
      (c: [string, unknown]) => c[0] === 'objectClicked'
    )?.[1] as (obj: unknown) => void;

    objectClickedHandler(null);
    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('should register contextmenu DOM listener on container', () => {
    const container = createContainer();
    const addSpy = jest.spyOn(container, 'addEventListener');
    const mockAladin = createMockAladin();

    renderHook(() =>
      useAladinEvents({
        containerRef: { current: container },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    expect(addSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
  });

  it('should register touch event listeners for long-press', () => {
    const container = createContainer();
    const addSpy = jest.spyOn(container, 'addEventListener');
    const mockAladin = createMockAladin();

    renderHook(() =>
      useAladinEvents({
        containerRef: { current: container },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    const eventNames = addSpy.mock.calls.map(c => c[0]);
    expect(eventNames).toContain('touchstart');
    expect(eventNames).toContain('touchmove');
    expect(eventNames).toContain('touchend');
  });

  it('should cleanup event listeners on unmount', () => {
    const container = createContainer();
    const removeSpy = jest.spyOn(container, 'removeEventListener');
    const mockAladin = createMockAladin();

    const { unmount } = renderHook(() =>
      useAladinEvents({
        containerRef: { current: container },
        aladinRef: { current: mockAladin as never },
        engineReady: true,
        onSelectionChange: jest.fn(),
        onContextMenu: jest.fn(),
      })
    );

    unmount();

    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain('contextmenu');
    expect(removedEvents).toContain('touchstart');
    expect(removedEvents).toContain('touchmove');
    expect(removedEvents).toContain('touchend');
  });
});
