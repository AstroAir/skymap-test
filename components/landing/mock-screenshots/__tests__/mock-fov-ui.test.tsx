import '../../test-utils';

import { render, screen } from '@testing-library/react';
import { MockFovUI } from '../mock-fov-ui';

describe('MockFovUI', () => {
  it('renders the FOV label and mosaic preview elements', () => {
    const { container } = render(<MockFovUI />);

    expect(screen.getByText(/ASI2600MC/)).toBeInTheDocument();
    expect(container.querySelectorAll('.absolute.rounded-full.bg-white')).toHaveLength(12);
    expect(container.querySelectorAll('.grid.grid-cols-2 > div')).toHaveLength(4);
  });
});
