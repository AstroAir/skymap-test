/**
 * @jest-environment jsdom
 */

// Mock storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

import { useEventSourcesStore } from '../event-sources-store';
import { act } from '@testing-library/react';

describe('useEventSourcesStore', () => {
  beforeEach(() => {
    act(() => {
      useEventSourcesStore.getState().resetToDefaults();
    });
  });

  describe('default state', () => {
    it('should have default sources', () => {
      const { sources } = useEventSourcesStore.getState();
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should include USNO source', () => {
      const { sources } = useEventSourcesStore.getState();
      const usno = sources.find(s => s.id === 'usno');
      expect(usno).toBeDefined();
      expect(usno?.enabled).toBe(true);
      expect(usno?.apiUrl).toContain('usno');
    });

    it('should include local calculations source', () => {
      const { sources } = useEventSourcesStore.getState();
      const local = sources.find(s => s.id === 'local');
      expect(local).toBeDefined();
      expect(local?.enabled).toBe(true);
      expect(local?.priority).toBe(99);
    });

    it('should have astronomyapi disabled by default', () => {
      const { sources } = useEventSourcesStore.getState();
      const astApi = sources.find(s => s.id === 'astronomyapi');
      expect(astApi).toBeDefined();
      expect(astApi?.enabled).toBe(false);
    });
  });

  describe('toggleSource', () => {
    it('should toggle a source enabled state', () => {
      act(() => {
        useEventSourcesStore.getState().toggleSource('usno');
      });
      const usno = useEventSourcesStore.getState().sources.find(s => s.id === 'usno');
      expect(usno?.enabled).toBe(false);

      act(() => {
        useEventSourcesStore.getState().toggleSource('usno');
      });
      const usnoAgain = useEventSourcesStore.getState().sources.find(s => s.id === 'usno');
      expect(usnoAgain?.enabled).toBe(true);
    });
  });

  describe('updateSource', () => {
    it('should update source properties', () => {
      act(() => {
        useEventSourcesStore.getState().updateSource('usno', {
          apiUrl: 'https://custom-usno.example.com',
          apiKey: 'test-key-123',
        });
      });
      const usno = useEventSourcesStore.getState().sources.find(s => s.id === 'usno');
      expect(usno?.apiUrl).toBe('https://custom-usno.example.com');
      expect(usno?.apiKey).toBe('test-key-123');
    });

    it('should not affect other sources', () => {
      const imoBefore = useEventSourcesStore.getState().sources.find(s => s.id === 'imo');
      act(() => {
        useEventSourcesStore.getState().updateSource('usno', { name: 'Updated' });
      });
      const imoAfter = useEventSourcesStore.getState().sources.find(s => s.id === 'imo');
      expect(imoAfter).toEqual(imoBefore);
    });
  });

  describe('addSource', () => {
    it('should add a custom source', () => {
      const countBefore = useEventSourcesStore.getState().sources.length;
      act(() => {
        useEventSourcesStore.getState().addSource({
          id: 'custom-test',
          name: 'Custom Test API',
          apiUrl: 'https://api.custom.com',
          apiKey: '',
          enabled: true,
          priority: 10,
          cacheMinutes: 30,
        });
      });
      const { sources } = useEventSourcesStore.getState();
      expect(sources.length).toBe(countBefore + 1);
      const custom = sources.find(s => s.id === 'custom-test');
      expect(custom?.name).toBe('Custom Test API');
    });
  });

  describe('removeSource', () => {
    it('should remove a source by id', () => {
      act(() => {
        useEventSourcesStore.getState().addSource({
          id: 'to-remove',
          name: 'Remove Me',
          apiUrl: '',
          apiKey: '',
          enabled: true,
          priority: 50,
          cacheMinutes: 60,
        });
      });
      expect(useEventSourcesStore.getState().sources.find(s => s.id === 'to-remove')).toBeDefined();

      act(() => {
        useEventSourcesStore.getState().removeSource('to-remove');
      });
      expect(useEventSourcesStore.getState().sources.find(s => s.id === 'to-remove')).toBeUndefined();
    });
  });

  describe('reorderSources', () => {
    it('should reorder sources and update priorities', () => {
      act(() => {
        useEventSourcesStore.getState().reorderSources(['imo', 'usno']);
      });
      const { sources } = useEventSourcesStore.getState();
      const imo = sources.find(s => s.id === 'imo');
      const usno = sources.find(s => s.id === 'usno');
      expect(imo?.priority).toBe(1);
      expect(usno?.priority).toBe(2);
    });
  });

  describe('resetToDefaults', () => {
    it('should restore all defaults', () => {
      act(() => {
        useEventSourcesStore.getState().toggleSource('usno');
        useEventSourcesStore.getState().updateSource('imo', { apiKey: 'key' });
      });
      // Verify mutations took effect
      expect(useEventSourcesStore.getState().sources.find(s => s.id === 'usno')?.enabled).toBe(false);

      act(() => {
        useEventSourcesStore.getState().resetToDefaults();
      });
      const usno = useEventSourcesStore.getState().sources.find(s => s.id === 'usno');
      expect(usno?.enabled).toBe(true);
      const imo = useEventSourcesStore.getState().sources.find(s => s.id === 'imo');
      expect(imo?.apiKey).toBe('');
    });
  });
});
