import '../test-utils';

import { render, screen } from '@testing-library/react';
import { CTASection } from '../cta-section';
import { EXTERNAL_LINKS } from '@/lib/constants/external-links';

describe('CTASection', () => {
  it('renders the CTA copy and all primary actions', () => {
    render(<CTASection />);

    expect(screen.getByRole('region', { name: 'title' })).toHaveAttribute('aria-labelledby', 'cta-title');
    expect(screen.getByRole('heading', { name: 'title' })).toHaveAttribute('id', 'cta-title');
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('launchButton').closest('a')).toHaveAttribute('href', '/starmap');
    expect(screen.getByRole('link', { name: 'downloadButton' })).toHaveAttribute('href', EXTERNAL_LINKS.releases);
    expect(screen.getByRole('link', { name: 'githubButton' })).toHaveAttribute('href', EXTERNAL_LINKS.repository);
  });
});
