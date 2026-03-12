import '../../test-utils';

import { render, screen } from '@testing-library/react';
import { MockPlanningUI } from '../mock-planning-ui';

describe('MockPlanningUI', () => {
  it('renders the planning list and altitude chart labels', () => {
    render(<MockPlanningUI />);

    expect(screen.getByText("Tonight's Plan")).toBeInTheDocument();
    expect(screen.getByText('M42 Orion Nebula')).toBeInTheDocument();
    expect(screen.getByText('NGC 7000 N.America')).toBeInTheDocument();
    expect(screen.getByText('M31 Andromeda')).toBeInTheDocument();
    expect(screen.getByText('Altitude Chart')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
  });
});
