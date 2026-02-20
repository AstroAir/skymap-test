'use client';

import { useCallback, RefObject } from 'react';
import type { StellariumEngine } from '@/lib/core/types';

interface CalendarArgs {
  start: Date;
  end: Date;
}

export function useStellariumCalendar(stelRef: RefObject<StellariumEngine | null>) {
  const runCalendar = useCallback(async ({ start, end }: CalendarArgs): Promise<unknown[]> => {
    const stel = stelRef.current;
    if (!stel?.calendar) return [];

    const events: unknown[] = [];
    stel.calendar({
      start,
      end,
      onEvent: (event: unknown) => {
        events.push(event);
      },
    });
    return events;
  }, [stelRef]);

  return { runCalendar };
}
