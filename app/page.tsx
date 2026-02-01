import {
  Navbar,
  HeroSection,
  FeaturesSection,
  ScreenshotCarousel,
  TechStack,
  CTASection,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ScreenshotCarousel />
      <TechStack />
      <CTASection />
      <Footer />
    </main>
  );
}
