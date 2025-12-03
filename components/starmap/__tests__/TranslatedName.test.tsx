/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranslatedName } from '../TranslatedName';

// Mock the hook
jest.mock('@/lib/starmap/hooks', () => ({
  useCelestialName: jest.fn((name: string) => {
    // Return translated name for known objects
    const translations: Record<string, string> = {
      'Polaris': '北极星',
      'Sirius': '天狼星',
      'Orion Nebula': '猎户座大星云',
    };
    return translations[name] || null;
  }),
}));

describe('TranslatedName', () => {
  it('renders the translated name when available', () => {
    render(<TranslatedName name="Polaris" />);
    
    expect(screen.getByText('北极星')).toBeInTheDocument();
  });

  it('renders the original name when translation is not available', () => {
    render(<TranslatedName name="Unknown Star" />);
    
    expect(screen.getByText('Unknown Star')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<TranslatedName name="Sirius" className="custom-class" />);
    
    const element = screen.getByText('天狼星');
    expect(element).toHaveClass('custom-class');
  });

  it('renders as a span element', () => {
    render(<TranslatedName name="Orion Nebula" />);
    
    const element = screen.getByText('猎户座大星云');
    expect(element.tagName).toBe('SPAN');
  });
});
