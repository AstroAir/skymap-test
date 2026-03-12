import '../../test-utils';

import { render, screen } from '@testing-library/react';
import { MockStarmapUI } from '../mock-starmap-ui';

describe('MockStarmapUI', () => {
  it('renders the mock object info panel', () => {
    render(<MockStarmapUI />);

    expect(screen.getByText('M31 - Andromeda Galaxy')).toBeInTheDocument();
    expect(screen.getByText('RA: 00h 42m 44s')).toBeInTheDocument();
    expect(screen.getByText('Mag: 3.4')).toBeInTheDocument();
  });
});
