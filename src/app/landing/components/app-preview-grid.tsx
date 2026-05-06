import { APP_SCREENS } from "../constants";

function AppScreen({ name, rotation }: { name: string; rotation: number }) {
  return (
    <div
      className="relative bg-card border-2 border-border rounded-none transition-transform hover:scale-105 hover:glow-emerald overflow-hidden"
      style={{
        transform: `rotate(${rotation}deg)`,
        height: rotation !== 0 ? "280px" : "280px",
      }}
    >
      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-background border-2 border-border rounded-b-sm z-10" />

      {/* Screen Content */}
      <div className="pt-6 px-3 h-full flex flex-col">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
          {name}
        </p>
        <div className="flex-1 bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Screen Preview</p>
        </div>
      </div>
    </div>
  );
}

export default function AppPreviewGrid() {
  return (
    <section className="py-32 bg-background border-t-2 border-border relative overflow-hidden">
      {/* Decorative Background Number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] font-heading font-bold text-muted opacity-10 leading-none pointer-events-none">
        SCREENS
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tighter text-foreground text-center mb-16">
          THE APP IN ACTION
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {APP_SCREENS.map((screen, index) => (
            <div
              key={screen.name}
              className={screen.spansTwo ? "md:row-span-2" : ""}
            >
              <AppScreen name={screen.name} rotation={screen.rotation} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
