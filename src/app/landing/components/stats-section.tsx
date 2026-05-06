import { STATS } from "../constants";

export default function StatsSection() {
  return (
    <section className="py-32 bg-background border-t-2 border-border relative overflow-hidden">
      {/* Decorative Background Number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] font-heading font-bold text-muted opacity-10 leading-none pointer-events-none">
        NUMBERS
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="space-y-16 md:space-y-20 max-w-4xl mx-auto">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-[6rem] md:text-[8rem] lg:text-[10rem] font-heading font-bold uppercase tracking-tighter text-primary leading-none">
                {stat.number}
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground uppercase tracking-widest mt-4">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
