/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DailyKnowledgeDialog } from '../daily-knowledge-dialog';

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const itemA = {
  id: 'item-a',
  dateKey: '2026-02-20',
  source: 'curated' as const,
  title: 'Item A',
  summary: 'Summary A',
  body: 'Body A',
  contentLanguage: 'en',
  categories: ['object' as const],
  tags: ['m31'],
  relatedObjects: [{ name: 'M31', ra: 10.68, dec: 41.26 }],
  attribution: {
    sourceName: 'Curated',
    licenseName: 'CC BY-SA',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  externalUrl: 'https://example.com/a',
  fetchedAt: 1,
};

const itemB = {
  ...itemA,
  id: 'item-b',
  title: 'Item B',
  summary: 'Summary B',
  tags: ['m42'],
  relatedObjects: [{ name: 'M42' }],
  fetchedAt: 2,
};

const mockStore = {
  open: true,
  loading: false,
  error: null as string | null,
  items: [itemA, itemB],
  currentItem: itemA,
  favorites: [] as Array<{ itemId: string; createdAt: number }>,
  history: [{ itemId: 'item-a', shownAt: Date.now(), entry: 'manual' as const, dateKey: '2026-02-20' }],
  filters: {
    query: '',
    category: 'all' as const,
    source: 'all' as const,
    favoritesOnly: false,
  },
  closeDialog: jest.fn(),
  loadDaily: jest.fn(),
  next: jest.fn(),
  prev: jest.fn(),
  random: jest.fn(),
  toggleFavorite: jest.fn(),
  setFilters: jest.fn(),
  setCurrentItemById: jest.fn(),
  markDontShowToday: jest.fn(),
  goToRelatedObject: jest.fn(),
  recordHistory: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useDailyKnowledgeStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}));

function findButtonByIcon(iconClass: string): HTMLButtonElement {
  const iconName = iconClass.replace(/^lucide-/, '');
  const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
    candidate.querySelector(`svg.${iconClass}, svg[data-lucide="${iconName}"]`)
  );
  if (!button) {
    throw new Error(`Button not found for ${iconClass}`);
  }
  return button as HTMLButtonElement;
}

describe('daily-knowledge-dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.open = true;
    mockStore.loading = false;
    mockStore.error = null;
    mockStore.items = [itemA, itemB];
    mockStore.currentItem = itemA;
    mockStore.favorites = [];
    mockStore.history = [{ itemId: 'item-a', shownAt: Date.now(), entry: 'manual', dateKey: '2026-02-20' }];
    mockStore.filters = {
      query: '',
      category: 'all',
      source: 'all',
      favoritesOnly: false,
    };

    Object.defineProperty(global.navigator, 'share', {
      configurable: true,
      value: jest.fn().mockRejectedValue(new Error('share-failed')),
    });
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('supports search/filter controls and navigation buttons', () => {
    render(<DailyKnowledgeDialog />);

    fireEvent.change(screen.getByPlaceholderText('dailyKnowledge.searchPlaceholder'), {
      target: { value: 'M31' },
    });
    expect(mockStore.setFilters).toHaveBeenCalledWith({ query: 'M31' });

    fireEvent.click(findButtonByIcon('lucide-chevron-left'));
    fireEvent.click(findButtonByIcon('lucide-chevron-right'));
    fireEvent.click(findButtonByIcon('lucide-shuffle'));

    expect(mockStore.prev).toHaveBeenCalled();
    expect(mockStore.next).toHaveBeenCalled();
    expect(mockStore.random).toHaveBeenCalled();
  });

  it('supports favorite/history and related-object jump', () => {
    render(<DailyKnowledgeDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'dailyKnowledge.favorite' }));
    expect(mockStore.toggleFavorite).toHaveBeenCalledWith('item-a');

    fireEvent.click(findButtonByIcon('lucide-history'));
    fireEvent.click(screen.getByRole('button', { name: /Item A/ }));
    expect(mockStore.setCurrentItemById).toHaveBeenCalledWith('item-a');

    fireEvent.click(screen.getByRole('button', { name: /M31/ }));
    expect(mockStore.goToRelatedObject).toHaveBeenCalledWith({ name: 'M31', ra: 10.68, dec: 41.26 });
  });

  it('uses share->clipboard fallback and supports copy action', async () => {
    render(<DailyKnowledgeDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'dailyKnowledge.share' }));
    await Promise.resolve();

    const shareMock = global.navigator.share as jest.Mock;
    const writeTextMock = global.navigator.clipboard.writeText as jest.Mock;
    expect(shareMock).toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'dailyKnowledge.copy' }));
    await Promise.resolve();
    expect(writeTextMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
