import Hero from "./landing/components/hero";
import MarqueeSection from "./landing/components/marquee";
import FeatureSections from "./landing/components/feature-sections";
import DifferentiationCards from "./landing/components/differentiation-cards";
import FinalCTA from "./landing/components/final-cta";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <MarqueeSection />
      <FeatureSections />
      <DifferentiationCards />
      <FinalCTA />
    </main>
  );
}
