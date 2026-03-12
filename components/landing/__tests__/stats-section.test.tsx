import '../test-utils';

import { render, screen } from '@testing-library/react';
import { StatsSection } from '../stats-section';
import { setMockInView } from '../test-utils';

describe('StatsSection', () => {
  it('animates the stat totals when the section is in view', () => {
    const { container } = render(<StatsSection />);

    expect(screen.getByRole('region', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByText('2B+')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('2+')).toBeInTheDocument();
    expect(screen.getByText('celestialObjects.label')).toBeInTheDocument();
    expect(screen.getByText('platforms.label')).toBeInTheDocument();
    expect(screen.getByText('openSource.label')).toBeInTheDocument();
    expect(screen.getByText('languages.label')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-fade-in')).toHaveLength(4);
  });

  it('keeps the counters at zero before the section enters view', () => {
    setMockInView(false);

    render(<StatsSection />);

    expect(screen.getByText('0B+')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0+')).toBeInTheDocument();
    expect(screen.queryByText('2B+')).not.toBeInTheDocument();
  });
});
