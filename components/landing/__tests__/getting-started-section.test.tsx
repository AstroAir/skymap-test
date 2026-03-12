import '../test-utils';

import { render, screen } from '@testing-library/react';
import { GettingStartedSection } from '../getting-started-section';
import { setMockInView } from '../test-utils';

const STEP_KEYS = ['launch', 'setup', 'observe'] as const;

describe('GettingStartedSection', () => {
  it('renders the step cards and CTA link', () => {
    render(<GettingStartedSection />);

    expect(screen.getByRole('region', { name: 'title' })).toHaveAttribute('id', 'getting-started');
    expect(screen.getByRole('heading', { name: 'title' })).toHaveAttribute('id', 'getting-started-title');

    STEP_KEYS.forEach((key) => {
      expect(screen.getByText(`${key}.title`)).toBeInTheDocument();
      expect(screen.getByText(`${key}.description`)).toBeInTheDocument();
    });

    expect(screen.getByText('cta').closest('a')).toHaveAttribute('href', '/starmap');
  });

  it('omits fade-in classes when the section is not visible yet', () => {
    setMockInView(false);
    const { container } = render(<GettingStartedSection />);

    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(0);
  });
});
