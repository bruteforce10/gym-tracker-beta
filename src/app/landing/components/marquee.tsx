import Marquee from "react-fast-marquee";
import { MARQUEE_TEXT } from "../constants";

export default function MarqueeSection() {
  return (
    <section className="h-20 md:h-24 bg-background border-y-2 border-border flex items-center overflow-hidden">
      <Marquee
        speed={80}
        direction="left"
        gradient={false}
        pauseOnHover={false}
        className="w-full"
      >
        <span className="text-primary font-heading font-bold uppercase tracking-tighter text-2xl md:text-3xl whitespace-nowrap">
          {MARQUEE_TEXT}
        </span>
      </Marquee>
    </section>
  );
}
