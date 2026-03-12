/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceWorkspace } from '../device-workspace';
import { useDeviceStore } from '@/lib/stores/device-store';

function seedStore(): void {
  useDeviceStore.setState({
    profiles: [
      {
        id: 'mount-1',
        name: 'Primary Mount',
        type: 'mount',
        source: 'mount-store',
        enabled: true,
        metadata: {
          protocol: 'alpaca',
          host: 'localhost',
          port: 11111,
          deviceId: 0,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    connections: {
      'mount-1': {
        profileId: 'mount-1',
        state: 'failed',
        updatedAt: '2026-01-01T00:00:00.000Z',
        attempts: 1,
        lastError: {
          code: 'timeout',
          message: 'Connection timeout',
          recoverable: true,
        },
      },
    },
    diagnostics: {
      'mount-1': [
        {
          id: 'evt-1',
          profileId: 'mount-1',
          at: '2026-01-01T00:00:00.000Z',
          from: 'connecting',
          to: 'failed',
          trigger: 'user_connect',
          errorMessage: 'Connection timeout',
        },
      ],
    },
    readiness: {
      state: 'blocked',
      requiredTypes: ['camera', 'telescope', 'mount'],
      issues: [
        {
          code: 'device-failed',
          level: 'blocked',
          type: 'mount',
          profileId: 'mount-1',
          message: 'Connection timeout',
          remediation: 'Retry',
        },
      ],
      checkedAt: '2026-01-01T00:00:00.000Z',
    },
    requiredSessionDeviceTypes: ['camera', 'telescope', 'mount'],
    activeSessionProfileIds: [],
    diagnosticsLimitPerProfile: 100,
  });
}

describe('DeviceWorkspace', () => {
  beforeEach(() => {
    seedStore();
  });

  it('renders readiness and profile status', () => {
    render(<DeviceWorkspace />);
    expect(screen.getByText('Device Workspace')).toBeInTheDocument();
    expect(screen.getByText('Session readiness')).toBeInTheDocument();
    expect(screen.getAllByText('Connection timeout').length).toBeGreaterThan(0);
    expect(screen.getByText('Primary Mount')).toBeInTheDocument();
  });

  it('allows retry action for failed profile', () => {
    render(<DeviceWorkspace />);
    const retryButton = screen.getAllByRole('button', { name: 'Retry' })[0];
    fireEvent.click(retryButton);
    const connection = useDeviceStore.getState().connections['mount-1'];
    expect(connection?.state).toBe('connecting');
  });
});
