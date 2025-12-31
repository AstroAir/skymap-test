import { render, screen, fireEvent } from '@testing-library/react';
import { ObjectTypeLegend, ObjectTypeLegendContent } from '../object-type-legend';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const messages: Record<string, Record<string, string>> = {
      objects: {
        galaxy: 'Galaxy',
        nebula: 'Nebula',
        planetaryNebula: 'Planetary Nebula',
        supernovaRemnant: 'Supernova Remnant',
        openCluster: 'Open Cluster',
        globularCluster: 'Globular Cluster',
        star: 'Star',
        doubleStar: 'Double Star',
        variableStar: 'Variable Star',
        planet: 'Planet',
        moon: 'Moon',
        asteroid: 'Asteroid',
        comet: 'Comet',
        quasar: 'Quasar',
      },
      legend: {
        objectTypes: 'Legend',
        objectTypesTitle: 'Celestial Object Types',
        galaxies: 'Galaxies',
        nebulae: 'Nebulae',
        clusters: 'Star Clusters',
        stars: 'Stars',
        solarSystem: 'Solar System',
        exoticObjects: 'Exotic Objects',
      },
    };
    return (key: string) => messages[namespace]?.[key] || key;
  },
}));

const renderComponent = (component: React.ReactNode) => {
  return render(component);
};

describe('ObjectTypeLegend', () => {
  describe('Popover variant', () => {
    it('renders legend button', () => {
      renderComponent(<ObjectTypeLegend variant="popover" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows legend content when clicked', () => {
      renderComponent(<ObjectTypeLegend variant="popover" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText('Celestial Object Types')).toBeInTheDocument();
    });

    it('displays object types in popover', () => {
      renderComponent(<ObjectTypeLegend variant="popover" />);
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('Galaxy')).toBeInTheDocument();
      expect(screen.getByText('Nebula')).toBeInTheDocument();
      expect(screen.getByText('Star')).toBeInTheDocument();
    });
  });

  describe('Dialog variant', () => {
    it('renders legend button for dialog', () => {
      renderComponent(<ObjectTypeLegend variant="dialog" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens dialog when clicked', () => {
      renderComponent(<ObjectTypeLegend variant="dialog" />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays categorized object types in dialog', () => {
      renderComponent(<ObjectTypeLegend variant="dialog" />);
      fireEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('Galaxies')).toBeInTheDocument();
      expect(screen.getByText('Nebulae')).toBeInTheDocument();
      expect(screen.getByText('Star Clusters')).toBeInTheDocument();
      expect(screen.getByText('Stars')).toBeInTheDocument();
      expect(screen.getByText('Solar System')).toBeInTheDocument();
    });
  });
});

describe('ObjectTypeLegendContent', () => {
  describe('compact mode', () => {
    it('renders all object types in grid', () => {
      renderComponent(<ObjectTypeLegendContent compact />);
      
      expect(screen.getByText('Galaxy')).toBeInTheDocument();
      expect(screen.getByText('Planetary Nebula')).toBeInTheDocument();
      expect(screen.getByText('Double Star')).toBeInTheDocument();
      expect(screen.getByText('Comet')).toBeInTheDocument();
    });
  });

  describe('full mode', () => {
    it('renders category headers', () => {
      renderComponent(<ObjectTypeLegendContent compact={false} />);
      
      expect(screen.getByText('Galaxies')).toBeInTheDocument();
      expect(screen.getByText('Nebulae')).toBeInTheDocument();
      expect(screen.getByText('Star Clusters')).toBeInTheDocument();
    });

    it('groups objects by category', () => {
      renderComponent(<ObjectTypeLegendContent compact={false} />);
      
      // Check that nebulae are grouped together
      expect(screen.getByText('Nebula')).toBeInTheDocument();
      expect(screen.getByText('Planetary Nebula')).toBeInTheDocument();
      expect(screen.getByText('Supernova Remnant')).toBeInTheDocument();
    });
  });
});
