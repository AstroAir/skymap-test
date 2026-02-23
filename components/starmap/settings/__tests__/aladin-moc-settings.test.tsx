/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores/aladin-store', () => ({
  useAladinStore: jest.fn((selector) => {
    const state = { mocLayers: [], addMocLayer: jest.fn(), removeMocLayer: jest.fn(), toggleMocLayer: jest.fn() };
    return selector(state);
  }),
}));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('../settings-shared', () => ({
  SettingsSection: ({ children, title }: React.PropsWithChildren<{ title: string }>) => <div><h3>{title}</h3>{children}</div>,
  ToggleItem: ({ label }: { label: string }) => <div>{label}</div>,
}));

import { AladinMocSettings } from '../aladin-moc-settings';

describe('AladinMocSettings', () => {
  it('renders without crashing', () => {
    render(<AladinMocSettings />);
  });
});
