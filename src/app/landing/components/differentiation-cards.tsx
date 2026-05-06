import { DIFFERENTIATION_CARDS } from "../constants";

export default function DifferentiationCards() {
  return (
    <section className="py-32 bg-background border-t-2 border-border relative overflow-hidden">
      {/* Decorative Background Number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] font-heading font-bold text-muted opacity-10 leading-none pointer-events-none">
        WHY
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tighter text-foreground text-center mb-16">
          NOT JUST A GYM APP
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {DIFFERENTIATION_CARDS.map((card, index) => (
            <div
              key={index}
              className="group border-2 border-border p-12 transition-all duration-300 hover:bg-primary hover:border-primary hover:scale-102 cursor-pointer"
            >
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold uppercase tracking-tighter text-foreground group-hover:text-primary-foreground mb-4">
                {card.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
