/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      data-testid="input" 
      {...props} 
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('https')}>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span>Select...</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button">{children}</button>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

import { ConnectionSettings } from '../connection-settings';

describe('ConnectionSettings', () => {
  const mockOnConnectionChange = jest.fn();
  const mockOnProtocolChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders connection settings section', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('renders protocol select', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('renders IP address input', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBe(2); // IP and port inputs
  });

  it('renders port input', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBe(2);
  });

  it('displays current connection values', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: '192.168.1.100', port: '8080' }}
        localProtocol="https"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('192.168.1.100');
    expect(inputs[1]).toHaveValue('8080');
  });

  it('calls onConnectionChange when IP is changed', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[0], { target: { value: '192.168.1.1' } });
    expect(mockOnConnectionChange).toHaveBeenCalled();
  });

  it('calls onConnectionChange when port is changed', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[1], { target: { value: '9000' } });
    expect(mockOnConnectionChange).toHaveBeenCalled();
  });

  it('renders labels for connection fields', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    expect(screen.getAllByTestId('label').length).toBeGreaterThan(0);
  });
});

describe('ConnectionSettings validation tests', () => {
  const mockOnConnectionChange = jest.fn();
  const mockOnProtocolChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles empty IP address', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: '', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('');
  });

  it('handles empty port', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[1]).toHaveValue('');
  });

  it('handles IPv4 address', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: '192.168.1.100', port: '8080' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('192.168.1.100');
  });

  it('handles IPv6 address', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: '::1', port: '8080' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('::1');
  });

  it('handles hostname with subdomain', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'api.example.com', port: '443' }}
        localProtocol="https"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('api.example.com');
  });

  it('handles https protocol', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '443' }}
        localProtocol="https"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'https');
  });

  it('handles port change to non-standard port', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[1], { target: { value: '65535' } });
    expect(mockOnConnectionChange).toHaveBeenCalledWith({ ip: 'localhost', port: '65535' });
  });

  it('handles special characters in IP field', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[0], { target: { value: 'test-server.local' } });
    expect(mockOnConnectionChange).toHaveBeenCalledWith({ ip: 'test-server.local', port: '1888' });
  });

  it('handles both fields empty', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: '', port: '' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
  });

  it('handles protocol change callback', () => {
    render(
      <ConnectionSettings
        localConnection={{ ip: 'localhost', port: '1888' }}
        localProtocol="http"
        onConnectionChange={mockOnConnectionChange}
        onProtocolChange={mockOnProtocolChange}
      />
    );
    
    fireEvent.click(screen.getByTestId('select'));
    expect(mockOnProtocolChange).toHaveBeenCalledWith('https');
  });
});
