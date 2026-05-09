import type { Metadata } from "next";

import Hero from "./landing/components/hero";
import MarqueeSection from "./landing/components/marquee";
import FeatureSections from "./landing/components/feature-sections";
import DifferentiationCards from "./landing/components/differentiation-cards";
import FinalCTA from "./landing/components/final-cta";

export const metadata: Metadata = {
  title: "Grynx - Track Workouts and Build Progress",
  description:
    "Grynx helps lifters track workouts, see strength progress, and keep training momentum clear.",
};

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
