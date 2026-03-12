import '../test-utils';

import { render, screen } from '@testing-library/react';
import { FeaturesSection } from '../features-section';
import { setMockInView } from '../test-utils';

const FEATURE_KEYS = [
  'stellarium',
  'planning',
  'shotList',
  'fovSimulator',
  'tonight',
  'coordinates',
  'equipment',
  'i18n',
] as const;

describe('FeaturesSection', () => {
  it('renders the section header and every feature card', () => {
    render(<FeaturesSection />);

    expect(screen.getByRole('region', { name: 'title' })).toHaveAttribute('id', 'features');
    expect(screen.getByRole('heading', { name: 'title' })).toHaveAttribute('id', 'features-title');

    FEATURE_KEYS.forEach((key) => {
      expect(screen.getByText(`${key}.title`)).toBeInTheDocument();
      expect(screen.getByText(`${key}.description`)).toBeInTheDocument();
    });
  });

  it('applies staggered animation classes only when in view', () => {
    const { container, rerender } = render(<FeaturesSection />);
    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(8);

    setMockInView(false);
    rerender(<FeaturesSection />);

    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(0);
  });
});
