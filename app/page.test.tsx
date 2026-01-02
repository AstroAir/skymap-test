/**
 * @jest-environment jsdom
 */

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

import { redirect } from 'next/navigation';
import Home from './page';

const mockRedirect = redirect as unknown as jest.Mock;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /starmap', () => {
    // Call the component function directly since it's a server component that redirects
    try {
      Home();
    } catch {
      // redirect throws in Next.js, so we catch it
    }
    expect(mockRedirect).toHaveBeenCalledWith('/starmap');
  });
});
