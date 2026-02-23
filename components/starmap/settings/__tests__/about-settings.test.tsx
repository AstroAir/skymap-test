/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick} {...props}>{children}</button> }));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span> }));
jest.mock('@/components/ui/skeleton', () => ({ Skeleton: () => <div data-testid="skeleton" /> }));
jest.mock('../settings-shared', () => ({ SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div> }));
jest.mock('@/lib/tauri/hooks', () => ({ useAppSettings: jest.fn(() => ({ data: null, isLoading: false })) }));
jest.mock('@/lib/storage/platform', () => ({ isTauri: jest.fn(() => false) }));
jest.mock('@/lib/tauri/app-control-api', () => ({ openExternalUrl: jest.fn() }));
jest.mock('@/lib/constants/external-links', () => ({ EXTERNAL_LINKS: { github: 'https://github.com', docs: 'https://docs.example.com' } }));
jest.mock('@/components/starmap/dialogs/feedback-dialog', () => ({ FeedbackDialog: () => <div data-testid="feedback-dialog" /> }));

import { AboutSettings } from '../about-settings';

describe('AboutSettings', () => {
  it('renders without crashing', () => {
    render(<AboutSettings />);
  });
});
