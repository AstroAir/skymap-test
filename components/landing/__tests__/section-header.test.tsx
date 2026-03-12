import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../section-header';

describe('SectionHeader', () => {
  it('renders title and subtitle', () => {
    render(<SectionHeader title="Test Title" subtitle="Test Subtitle" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('applies the heading id when provided', () => {
    render(<SectionHeader id="my-section" title="Title" subtitle="Subtitle" />);

    expect(screen.getByRole('heading', { name: 'Title' })).toHaveAttribute('id', 'my-section');
  });

  it('renders without an id by default', () => {
    render(<SectionHeader title="Title" subtitle="Subtitle" />);

    expect(screen.getByRole('heading', { name: 'Title' })).not.toHaveAttribute('id');
  });
});
