/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

import { SearchBehaviorSettings } from '../search-settings';
import { useSettingsStore } from '@/lib/stores';

describe('SearchBehaviorSettings', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      search: {
        autoSearchDelay: 300,
        enableFuzzySearch: true,
        maxSearchResults: 50,
        includeMinorObjects: false,
        rememberSearchHistory: true,
        maxHistoryItems: 20,
      },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<SearchBehaviorSettings />);
    expect(container).toBeInTheDocument();
  });

  it('renders collapsible sections', () => {
    render(<SearchBehaviorSettings />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders switch controls for search toggles', () => {
    render(<SearchBehaviorSettings />);
    const switches = screen.getAllByRole('switch');
    // enableFuzzySearch, includeMinorObjects, rememberSearchHistory
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });

  it('renders section titles', () => {
    render(<SearchBehaviorSettings />);
    expect(screen.getByText('settingsNew.search.behavior')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.search.resultsAndTiming')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.search.history')).toBeInTheDocument();
  });

  it('reflects enableFuzzySearch state', () => {
    render(<SearchBehaviorSettings />);
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
  });

  it('reflects includeMinorObjects state', () => {
    render(<SearchBehaviorSettings />);
    const switches = screen.getAllByRole('switch');
    expect(switches[1]).not.toBeChecked();
  });

  it('calls setSearchSetting when toggling fuzzy search', () => {
    render(<SearchBehaviorSettings />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    const state = useSettingsStore.getState();
    expect(state.search.enableFuzzySearch).toBe(false);
  });

  it('calls setSearchSetting when toggling minor objects', () => {
    render(<SearchBehaviorSettings />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);
    const state = useSettingsStore.getState();
    expect(state.search.includeMinorObjects).toBe(true);
  });

  it('renders toggle descriptions', () => {
    render(<SearchBehaviorSettings />);
    expect(screen.getByText('settingsNew.search.fuzzySearchDesc')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.search.includeMinorObjectsDesc')).toBeInTheDocument();
  });
});
