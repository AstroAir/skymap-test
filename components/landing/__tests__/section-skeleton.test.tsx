import { render } from '@testing-library/react';
import { SectionSkeleton } from '../section-skeleton';

describe('SectionSkeleton', () => {
  it('renders placeholder blocks for the heading and cards', () => {
    const { container } = render(<SectionSkeleton />);

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(6);
    expect(container.querySelectorAll('.grid > div')).toHaveLength(4);
  });
});
