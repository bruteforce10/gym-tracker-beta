import type { Metadata } from "next";

import Hero from "./landing/components/hero";
import MarqueeSection from "./landing/components/marquee";
import FeatureSections from "./landing/components/feature-sections";
import DifferentiationCards from "./landing/components/differentiation-cards";
import FinalCTA from "./landing/components/final-cta";

export const metadata: Metadata = {
  title: "GRYNX - Gym Workout Tracker | Track Your Strength Progress",
  description:
    "GRYNX is the free gym workout tracker that helps you log exercises, track strength progress, and see real gains. Start building your best today.",
  alternates: {
    canonical: "https://grynx.app",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GRYNX",
    alternateName: "Grynx Gym Tracker",
    url: "https://grynx.app",
    description:
      "Free gym workout tracker. Log exercises, track strength progress, and build your best.",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "120",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background">
        <Hero />
        <MarqueeSection />
        <FeatureSections />
        <DifferentiationCards />
        <FinalCTA />
      </main>
    </>
  );
}
