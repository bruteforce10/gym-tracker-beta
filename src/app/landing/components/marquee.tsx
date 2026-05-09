import Marquee from "react-fast-marquee";
import { Zap } from "lucide-react";
import { MARQUEE_ITEMS } from "../constants";

export default function MarqueeSection() {
  return (
    <section
      aria-label="Highlights Grynx"
      className="relative overflow-hidden  bg-primary"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_14%,rgba(0,0,0,0)_52%,rgba(0,0,0,0.14)_100%),linear-gradient(90deg,rgba(52,211,153,0.98)_0%,rgba(16,185,129,0.98)_34%,rgba(5,150,105,0.98)_62%,rgba(52,211,153,0.98)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-emerald-light/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#062414]/40" />

      <Marquee
        autoFill
        speed={62}
        direction="left"
        gradient={false}
        pauseOnHover={false}
        className="relative w-full"
      >
        <div className="flex h-11 items-center gap-5 px-5 md:h-14 md:gap-8 md:px-8">
          {MARQUEE_ITEMS.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex shrink-0 items-center gap-5 md:gap-8"
            >
              <Zap
                aria-hidden="true"
                className="size-3.5 shrink-0 fill-primary-foreground text-primary-foreground md:size-4"
                strokeWidth={2.8}
              />
              <span className="font-data whitespace-nowrap text-[0.95rem] font-black uppercase leading-none tracking-[0.18em] text-primary-foreground md:text-[1.45rem]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
}
