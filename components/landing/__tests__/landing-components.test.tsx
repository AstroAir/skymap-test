/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', setTheme: jest.fn() }),
}));

// Mock use-star-field hook
jest.mock('@/lib/hooks/use-star-field', () => ({
  useStarField: jest.fn(),
}));

// Mock use-in-view hook
jest.mock('@/lib/hooks/use-in-view', () => ({
  useInView: () => ({ ref: { current: null }, isInView: true }),
}));

// Mock embla-carousel-react (used by shadcn Carousel)
jest.mock('embla-carousel-react', () => {
  return jest.fn(() => [jest.fn(), undefined]);
});

import { Navbar } from '../navbar';
import { HeroSection } from '../hero-section';
import { FeaturesSection } from '../features-section';
import { CTASection } from '../cta-section';
import { SectionHeader } from '../section-header';
import { StarField } from '../star-field';
import { Footer } from '../footer';
import { TechStack } from '../tech-stack';

// ============================================================================
// SectionHeader
// ============================================================================
describe('SectionHeader', () => {
  it('renders title and subtitle', () => {
    render(<SectionHeader title="Test Title" subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders with id prop for aria-labelledby', () => {
    render(<SectionHeader id="my-section" title="Title" subtitle="Sub" />);
    const heading = screen.getByText('Title');
    expect(heading).toHaveAttribute('id', 'my-section');
  });

  it('renders without id prop', () => {
    render(<SectionHeader title="Title" subtitle="Sub" />);
    const heading = screen.getByText('Title');
    expect(heading).not.toHaveAttribute('id');
  });
});

// ============================================================================
// Navbar
// ============================================================================
describe('Navbar', () => {
  it('renders with aria-label', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('renders logo text', () => {
    render(<Navbar />);
    expect(screen.getByText('SkyMap')).toBeInTheDocument();
  });

  it('renders nav items', () => {
    render(<Navbar />);
    expect(screen.getByText('nav.features')).toBeInTheDocument();
    expect(screen.getByText('nav.screenshots')).toBeInTheDocument();
    expect(screen.getByText('nav.technology')).toBeInTheDocument();
  });

  it('renders launch app button', () => {
    render(<Navbar />);
    expect(screen.getAllByText('nav.launchApp').length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile menu button with aria-label', () => {
    render(<Navbar />);
    const menuBtn = screen.getByLabelText('Open menu');
    expect(menuBtn).toBeInTheDocument();
  });

  it('starts with transparent background when not scrolled', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('bg-transparent');
  });
});

// ============================================================================
// HeroSection
// ============================================================================
describe('HeroSection', () => {
  it('renders hero content', () => {
    render(<HeroSection />);
    expect(screen.getByText('SkyMap')).toBeInTheDocument();
    expect(screen.getByText('hero.tagline')).toBeInTheDocument();
    expect(screen.getByText('hero.description')).toBeInTheDocument();
  });

  it('renders launch button', () => {
    render(<HeroSection />);
    expect(screen.getByText('hero.launchButton')).toBeInTheDocument();
  });

  it('renders scroll indicator with aria-label', () => {
    render(<HeroSection />);
    const scrollBtn = screen.getByLabelText('hero.scrollToFeatures');
    expect(scrollBtn).toBeInTheDocument();
  });
});

// ============================================================================
// StarField
// ============================================================================
describe('StarField', () => {
  it('renders canvas element', () => {
    const { container } = render(<StarField />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});

// ============================================================================
// FeaturesSection
// ============================================================================
describe('FeaturesSection', () => {
  it('renders section with aria-labelledby', () => {
    render(<FeaturesSection />);
    const section = document.getElementById('features');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'features-title');
  });

  it('renders section header with id', () => {
    render(<FeaturesSection />);
    const heading = document.getElementById('features-title');
    expect(heading).toBeInTheDocument();
  });

  it('renders all 8 feature cards', () => {
    render(<FeaturesSection />);
    const titles = [
      'stellarium.title',
      'planning.title',
      'shotList.title',
      'fovSimulator.title',
      'tonight.title',
      'coordinates.title',
      'equipment.title',
      'i18n.title',
    ];
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('applies animation classes when in view', () => {
    render(<FeaturesSection />);
    // useInView mock returns isInView=true, so cards should have animate-fade-in
    const cards = document.querySelectorAll('.animate-fade-in');
    expect(cards.length).toBe(8);
  });
});

// ============================================================================
// CTASection
// ============================================================================
describe('CTASection', () => {
  it('renders section with aria-labelledby', () => {
    const { container } = render(<CTASection />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cta-title');
  });

  it('renders CTA buttons', () => {
    render(<CTASection />);
    expect(screen.getByText('launchButton')).toBeInTheDocument();
    expect(screen.getByText('downloadButton')).toBeInTheDocument();
    expect(screen.getByText('githubButton')).toBeInTheDocument();
  });

  it('renders section header with id', () => {
    render(<CTASection />);
    const heading = document.getElementById('cta-title');
    expect(heading).toBeInTheDocument();
  });
});

// ============================================================================
// TechStack
// ============================================================================
describe('TechStack', () => {
  it('renders section with aria-labelledby', () => {
    render(<TechStack />);
    const section = document.getElementById('tech');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'tech-title');
  });

  it('renders all technology badges', () => {
    render(<TechStack />);
    expect(screen.getByText('Stellarium Web Engine')).toBeInTheDocument();
    expect(screen.getByText('Next.js 16')).toBeInTheDocument();
    expect(screen.getByText('React 19')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS v4')).toBeInTheDocument();
    expect(screen.getByText('Tauri 2.9')).toBeInTheDocument();
    expect(screen.getByText('Zustand')).toBeInTheDocument();
    expect(screen.getByText('shadcn/ui')).toBeInTheDocument();
  });

  it('renders engine highlight card', () => {
    render(<TechStack />);
    expect(screen.getByText('engineTitle')).toBeInTheDocument();
    expect(screen.getByText('engineDescription')).toBeInTheDocument();
  });
});

// ============================================================================
// Footer
// ============================================================================
describe('Footer', () => {
  it('renders footer element', () => {
    render(<Footer />);
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders footer nav with aria-label', () => {
    render(<Footer />);
    const nav = screen.getByLabelText('Footer links');
    expect(nav).toBeInTheDocument();
  });

  it('renders brand name', () => {
    render(<Footer />);
    expect(screen.getAllByText('SkyMap').length).toBeGreaterThanOrEqual(1);
  });

  it('renders copyright with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    const copyrightEl = screen.getByText(new RegExp(`© ${year}`));
    expect(copyrightEl).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer />);
    expect(screen.getByText('starmap')).toBeInTheDocument();
    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('stellarium')).toBeInTheDocument();
  });

  it('renders credits section', () => {
    render(<Footer />);
    expect(screen.getByText('credits')).toBeInTheDocument();
    expect(screen.getByText('stellariumEngine')).toBeInTheDocument();
    expect(screen.getByText('gaiaData')).toBeInTheDocument();
    expect(screen.getByText('dssImages')).toBeInTheDocument();
  });
});
