"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative flex min-h-[82svh] items-center justify-center overflow-hidden sm:min-h-screen">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/bg-hiro.webp')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,15,0.58)_0%,rgba(10,10,15,0.7)_34%,rgba(10,10,15,0.86)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(16,185,129,0.14),transparent_34%)]" />
      </div>

      {/* Decorative Background Number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 text-[10rem] md:text-[14rem] lg:text-[18rem] font-heading font-bold text-muted opacity-10 leading-none pointer-events-none">
        01
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-30 transition-all duration-500 ease-out ${scrolled ? "border-b border-white/10 bg-black/20 backdrop-blur-xl shadow-lg" : "bg-transparent border-transparent"}`}
      >
        <div className="container mx-auto flex items-center justify-center px-5 py-4 sm:justify-between sm:px-6 sm:py-5">
          <Link
            href="#top"
            className="inline-flex shrink-0 items-center"
            aria-label="Grynx home"
          >
            <Image
              src="/grynx-logo-horizontal.png"
              alt="Grynx"
              width={184}
              height={42}
              priority
              className="h-7 w-auto sm:h-8 md:h-9"
            />
          </Link>

          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <nav
              aria-label="Landing navigation"
              className="flex items-center gap-1 border border-white/10 bg-black/20 px-2 py-1.5 backdrop-blur-md sm:gap-2 sm:px-3"
            >
              <Link
                href="/login"
                className="px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78 transition-colors hover:text-white sm:px-3 sm:text-xs"
              >
                Feature
              </Link>
              <Link
                href="/login"
                className="px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78 transition-colors hover:text-white sm:px-3 sm:text-xs"
              >
                Why
              </Link>
            </nav>

            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center border border-transparent bg-primary px-3.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] sm:min-h-11 sm:px-5 sm:text-xs"
            >
              Start Now
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div
        id="top"
        className="relative z-10 container mx-auto px-5 py-20 text-center sm:px-6 sm:py-24"
      >
        <h1 className="mb-6 text-[2.7rem] font-heading font-bold uppercase leading-[0.96] tracking-tight text-white sm:mb-8 sm:text-5xl md:text-6xl lg:text-8xl">
          TRAIN HARD.
          <br />
          TRACK SMARTER.
        </h1>

        <p className="mx-auto mb-10 max-w-[19rem] text-xl leading-9 text-white/78 sm:mb-12 sm:max-w-2xl sm:text-xl sm:leading-8 md:text-2xl">
          Track workouts, build real progress, and share your journey.
        </p>

        {/* CTA Buttons */}
        <div className="mx-auto flex w-full max-w-[18rem] flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-14 w-full items-center justify-center border-2 border-transparent bg-primary px-6 py-4 text-center text-lg font-bold uppercase tracking-tight text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-[18rem] md:min-h-16 md:px-12 md:py-5 md:text-lg"
          >
            Start Tracking
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-14 w-full items-center justify-center border-2 border-border bg-transparent px-6 py-4 text-center text-lg font-bold uppercase tracking-tight text-foreground transition-colors hover:bg-foreground hover:text-background sm:w-[18rem] md:min-h-16 md:px-12 md:py-5 md:text-lg"
          >
            See Features
          </Link>
        </div>
      </div>
    </section>
  );
}
