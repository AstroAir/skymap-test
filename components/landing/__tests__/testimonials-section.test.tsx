import '../test-utils';

import { render, screen } from '@testing-library/react';
import { TestimonialsSection } from '../testimonials-section';
import { setMockInView } from '../test-utils';

const TESTIMONIAL_KEYS = ['astronomer', 'photographer', 'beginner'] as const;

describe('TestimonialsSection', () => {
  it('renders every testimonial with author metadata and ratings', () => {
    render(<TestimonialsSection />);

    expect(screen.getByRole('region', { name: 'title' })).toBeInTheDocument();
    TESTIMONIAL_KEYS.forEach((key) => {
      expect(screen.getByText(new RegExp(key + '\\.quote'))).toBeInTheDocument();
      expect(screen.getByText(`${key}.name`)).toBeInTheDocument();
      expect(screen.getByText(`${key}.role`)).toBeInTheDocument();
    });
    expect(screen.getAllByRole('img', { name: '5 out of 5 stars' })).toHaveLength(3);
  });

  it('removes fade-in classes when the cards are out of view', () => {
    setMockInView(false);
    const { container } = render(<TestimonialsSection />);

    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(0);
  });
});
