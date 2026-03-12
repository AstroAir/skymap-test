/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick} {...props}>{children}</button> }));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span> }));
jest.mock('@/components/ui/skeleton', () => ({ Skeleton: () => <div data-testid="skeleton" /> }));
jest.mock('../settings-shared', () => ({ SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div> }));
jest.mock('@/lib/tauri/hooks', () => ({ useAppSettings: jest.fn() }));
jest.mock('@/lib/storage/platform', () => ({ isTauri: jest.fn() }));
jest.mock('@/lib/tauri/app-control-api', () => ({ openExternalUrl: jest.fn() }));
jest.mock('@/lib/constants/external-links', () => ({ EXTERNAL_LINKS: { github: 'https://github.com', docs: 'https://docs.example.com' } }));
jest.mock('@/components/starmap/dialogs/feedback-dialog', () => ({ FeedbackDialog: () => <div data-testid="feedback-dialog" /> }));

import { AboutSettings } from '../about-settings';
import { useAppSettings } from '@/lib/tauri/hooks';
import { isTauri } from '@/lib/storage/platform';

const mockUseAppSettings = useAppSettings as jest.MockedFunction<typeof useAppSettings>;
const mockIsTauri = isTauri as jest.MockedFunction<typeof isTauri>;

describe('AboutSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppSettings.mockReturnValue({
      settings: null,
      systemInfo: null,
      loading: false,
      error: null,
      refresh: jest.fn(),
      updateSettings: jest.fn(),
      isAvailable: false,
    });
    mockIsTauri.mockReturnValue(false);
  });

  it('renders without crashing', () => {
    render(<AboutSettings />);
  });

  it('renders legacy system fields with expanded system info object', () => {
    mockIsTauri.mockReturnValue(true);
    mockUseAppSettings.mockReturnValue({
      settings: null,
      systemInfo: {
        os: 'windows',
        arch: 'x86_64',
        app_version: '0.1.0',
        tauri_version: '2.9.0',
        platform: 'windows',
        family: 'windows',
        os_type: 'Windows_NT',
        os_version: '11',
        locale: 'en-US',
        host_id: 'host-1234abcd',
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
      updateSettings: jest.fn(),
      isAvailable: true,
    });

    render(<AboutSettings />);

    expect(screen.getByText('windows')).toBeInTheDocument();
    expect(screen.getByText('x86_64')).toBeInTheDocument();
    expect(screen.getByText('2.9.0')).toBeInTheDocument();
  });
});
