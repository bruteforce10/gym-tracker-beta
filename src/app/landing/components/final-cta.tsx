import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/[0.16] bg-primary py-[clamp(5rem,12vw,11rem)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_18%,rgba(0,0,0,0.1)_72%,rgba(0,0,0,0.32)_100%),radial-gradient(circle_at_18%_20%,rgba(209,250,229,0.52),transparent_28%),radial-gradient(circle_at_82%_76%,rgba(4,120,87,0.6),transparent_32%),linear-gradient(135deg,#6ee7b7_0%,#10b981_36%,#059669_68%,#064e3b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-emerald-light/60" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#03140b]/55" />

      <div className="container mx-auto px-5 text-center sm:px-6">
        <p className="mb-5 font-data text-xs font-black uppercase tracking-[0.24em] text-[#042417]/80 sm:text-sm">
          Ready To Train
        </p>

        <h2 className="mx-auto mb-6 max-w-5xl text-balance font-heading text-[clamp(3rem,11vw,8.5rem)] font-black uppercase leading-[0.88] tracking-normal text-[#03140b] drop-shadow-[0_3px_0_rgba(255,255,255,0.18)]">
          START YOUR FIRST WORKOUT
        </h2>

        <p className="mx-auto mb-10 max-w-[34rem] text-lg leading-8 text-[#052817]/82 sm:mb-12 sm:text-xl md:text-2xl">
          Stop guessing. Start progressing.
        </p>

        <Link
          href="/login"
          className="inline-flex min-h-14 w-full max-w-[20rem] items-center justify-center gap-3 border-2 border-[#03140b] bg-[#020403] px-8 py-4 text-center text-lg font-black uppercase tracking-tight text-primary transition-transform hover:scale-[1.02] active:scale-[0.98] sm:min-h-16 sm:w-auto sm:px-12 md:text-xl"
        >
          GET STARTED
          <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.8} />
        </Link>
      </div>
    </section>
  );
}
