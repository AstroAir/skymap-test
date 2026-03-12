import '../../test-utils';

import { render, screen } from '@testing-library/react';
import { MockSettingsUI } from '../mock-settings-ui';

describe('MockSettingsUI', () => {
  it('renders the settings categories, profile details and actions', () => {
    render(<MockSettingsUI />);

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Equipment Profiles')).toBeInTheDocument();
    expect(screen.getByText('Telescope: RedCat 51 (250mm f/4.9)')).toBeInTheDocument();
    expect(screen.getByText('Camera: ZWO ASI2600MC Pro')).toBeInTheDocument();
    expect(screen.getByText('Filter: Optolong L-eXtreme')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
});
