import '../test-utils';

import { render } from '@testing-library/react';
import { StarField } from '../star-field';
import { mockUseStarField, setMockTheme } from '../test-utils';

describe('StarField', () => {
  it('renders the canvas and enables dark-mode stars by default', () => {
    const { container } = render(<StarField />);
    const canvas = container.querySelector('canvas');

    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pointer-events-none');
    expect(mockUseStarField).toHaveBeenCalledTimes(1);
    expect(mockUseStarField.mock.calls[0]?.[1]).toBe(true);
  });

  it('passes a light-theme flag to the star hook when needed', () => {
    setMockTheme('light');

    render(<StarField />);

    expect(mockUseStarField.mock.calls[0]?.[1]).toBe(false);
  });
});
