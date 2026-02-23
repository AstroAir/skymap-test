/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores/equipment-store', () => ({
  useEquipmentStore: jest.fn((selector) => {
    const state = {
      customTelescopes: [], customCameras: [],
      addCustomTelescope: jest.fn(), addCustomCamera: jest.fn(),
      activeCameraId: null, activeTelescopeId: null,
      sensorWidth: 23.5, sensorHeight: 15.6, focalLength: 400, pixelSize: 3.76, aperture: 80,
      applyCamera: jest.fn(), applyTelescope: jest.fn(),
      setCameraSettings: jest.fn(), setTelescopeSettings: jest.fn(),
    };
    return selector(state);
  }),
  BUILTIN_CAMERA_PRESETS: [],
  BUILTIN_TELESCOPE_PRESETS: [],
}));
jest.mock('@/lib/stores/onboarding-store', () => ({
  useOnboardingStore: jest.fn((selector) => {
    const state = { updateSetupData: jest.fn() };
    return selector(state);
  }),
}));
jest.mock('zustand/react/shallow', () => ({ useShallow: (fn: unknown) => fn }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: React.PropsWithChildren) => <label>{children}</label> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { EquipmentStep } from '../equipment-step';

describe('EquipmentStep', () => {
  it('renders without crashing', () => {
    render(<EquipmentStep />);
  });
});
