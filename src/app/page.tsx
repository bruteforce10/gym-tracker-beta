import Hero from "./landing/components/hero";
import MarqueeSection from "./landing/components/marquee";
import FeatureSections from "./landing/components/feature-sections";
import AppPreviewGrid from "./landing/components/app-preview-grid";
import DifferentiationCards from "./landing/components/differentiation-cards";
import StatsSection from "./landing/components/stats-section";
import FinalCTA from "./landing/components/final-cta";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <MarqueeSection />
      <FeatureSections />
      <AppPreviewGrid />
      <DifferentiationCards />
      <StatsSection />
      <FinalCTA />
    </main>
  );
}
