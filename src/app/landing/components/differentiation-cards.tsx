import { BarChart3, CornerUpRight, Zap, type LucideIcon } from "lucide-react";
import { DIFFERENTIATION_CARDS } from "../constants";

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  chart: BarChart3,
  share: CornerUpRight,
};

export default function DifferentiationCards() {
  return (
    <section
      id="why"
      className="relative overflow-hidden border-t-2 border-border bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.07),transparent_28%),linear-gradient(180deg,#0a0a0f_0%,#07090c_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.05]" />

      <div className="relative z-10 container mx-auto px-5 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-data text-sm font-extrabold uppercase tracking-[0.26em] text-primary sm:text-base">
            Why Grynx?
          </p>
          <h2 className="mt-3 text-balance font-heading text-[2.6rem] font-black uppercase leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Not Just A Gym App
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-3 lg:gap-5">
          {DIFFERENTIATION_CARDS.map((card) => {
            const Icon = ICONS[card.icon];

            return (
              <article
                key={card.title}
                className="group relative overflow-hidden border-2 border-primary/75 bg-[#040706] p-5 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1)] transition-[transform,border-color,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:border-white/50 hover:shadow-[0_18px_40px_rgba(255,255,255,0.08)] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_38%,rgba(255,255,255,0.01))] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex min-h-[184px] flex-col justify-between gap-7 sm:min-h-[198px]">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="flex size-14 shrink-0 items-center justify-center border border-primary/25 bg-primary/8 sm:size-16">
                      <Icon
                        aria-hidden="true"
                        className="size-8 text-primary sm:size-9"
                        strokeWidth={2.4}
                      />
                    </div>

                    <div className="min-w-0 pt-1">
                      <h3 className="font-heading text-[2rem] font-black uppercase leading-[0.92] tracking-tight text-white sm:text-[2.25rem]">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <p className="max-w-[22ch] text-lg leading-8 text-white/76 sm:text-[1.45rem] sm:leading-9">
                    {card.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
