/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; id?: string }) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onCheckedChange?.(e.target.checked)} 
      data-testid={`switch-${id || 'default'}`}
      id={id}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }) => (
    <label htmlFor={htmlFor} data-testid="label" {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (
    <div data-testid="collapsible" data-open={open}>{children}</div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
  CollapsibleTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="collapsible-trigger">{children}</div>
  ),
}));

import { SettingsSection, ToggleItem } from '../settings-shared';

describe('SettingsSection', () => {
  it('renders with title and icon', () => {
    render(
      <SettingsSection title="Test Section" icon={<span data-testid="icon">🔧</span>}>
        <div>Content</div>
      </SettingsSection>
    );
    
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('renders children in collapsible content', () => {
    render(
      <SettingsSection title="Test Section" icon={<span>🔧</span>}>
        <div data-testid="child-content">Child Content</div>
      </SettingsSection>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('defaults to open state', () => {
    render(
      <SettingsSection title="Test Section" icon={<span>🔧</span>}>
        <div>Content</div>
      </SettingsSection>
    );
    
    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'true');
  });

  it('respects defaultOpen=false prop', () => {
    render(
      <SettingsSection title="Test Section" icon={<span>🔧</span>} defaultOpen={false}>
        <div>Content</div>
      </SettingsSection>
    );
    
    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'false');
  });
});

describe('ToggleItem', () => {
  it('renders with label', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="test-toggle"
        label="Test Toggle"
        checked={false}
        onCheckedChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('renders switch with correct checked state', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="test-toggle"
        label="Test Toggle"
        checked={true}
        onCheckedChange={mockOnChange}
      />
    );
    
    const switchElement = screen.getByTestId('switch-test-toggle');
    expect(switchElement).toBeChecked();
  });

  it('calls onCheckedChange when toggled', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="test-toggle"
        label="Test Toggle"
        checked={false}
        onCheckedChange={mockOnChange}
      />
    );
    
    const switchElement = screen.getByTestId('switch-test-toggle');
    fireEvent.click(switchElement);
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders optional icon when provided', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="test-toggle"
        label="Test Toggle"
        checked={false}
        onCheckedChange={mockOnChange}
        icon="🌟"
      />
    );
    
    expect(screen.getByText('🌟')).toBeInTheDocument();
  });

  it('handles rapid toggle clicks', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="rapid-toggle"
        label="Rapid Toggle"
        checked={false}
        onCheckedChange={mockOnChange}
      />
    );
    
    const switchElement = screen.getByTestId('switch-rapid-toggle');
    fireEvent.click(switchElement);
    fireEvent.click(switchElement);
    fireEvent.click(switchElement);
    
    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });

  it('renders with empty label', () => {
    const mockOnChange = jest.fn();
    render(
      <ToggleItem
        id="empty-label"
        label=""
        checked={false}
        onCheckedChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('switch-empty-label')).toBeInTheDocument();
  });

  it('renders with long label text', () => {
    const mockOnChange = jest.fn();
    const longLabel = 'This is a very long label text that might cause layout issues in some cases';
    render(
      <ToggleItem
        id="long-label"
        label={longLabel}
        checked={true}
        onCheckedChange={mockOnChange}
      />
    );
    
    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });
});

describe('SettingsSection edge cases', () => {
  it('handles empty children', () => {
    render(
      <SettingsSection title="Empty Section" icon={<span>🔧</span>}>
        {null}
      </SettingsSection>
    );
    
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    render(
      <SettingsSection title="Multi Section" icon={<span>🔧</span>}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </SettingsSection>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('handles special characters in title', () => {
    render(
      <SettingsSection title="Settings & Options <test>" icon={<span>🔧</span>}>
        <div>Content</div>
      </SettingsSection>
    );
    
    expect(screen.getByText('Settings & Options <test>')).toBeInTheDocument();
  });
});
