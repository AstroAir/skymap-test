import '../test-utils';

import { render, screen } from '@testing-library/react';
import { TechStack } from '../tech-stack';
import { TECHNOLOGIES } from '@/lib/constants/landing';
import { setMockInView } from '../test-utils';

describe('TechStack', () => {
  it('renders every technology badge and the engine highlight card', () => {
    render(<TechStack />);

    expect(screen.getByRole('region', { name: 'title' })).toHaveAttribute('id', 'tech');
    TECHNOLOGIES.forEach(({ name }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(screen.getByText('engineTitle')).toBeInTheDocument();
    expect(screen.getByText('engineDescription')).toBeInTheDocument();
  });

  it('drops the scroll animation classes when the badges are out of view', () => {
    setMockInView(false);
    const { container } = render(<TechStack />);

    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(0);
  });
});
