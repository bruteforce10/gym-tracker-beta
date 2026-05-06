export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/4116f7af-a46f-46ae-9de8-b6ddf411558b/937d14473375b3afafbc63df118b219e.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1777817432&Signature=jokFL6n8nCK7AFQZSbyAGVf31uQ=')",
          }}
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      {/* Decorative Background Number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 text-[10rem] md:text-[14rem] lg:text-[18rem] font-heading font-bold text-muted opacity-10 leading-none pointer-events-none">
        01
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-heading font-bold uppercase tracking-tight leading-[1.1] text-white mb-8">
          TRAIN HARD.
          <br />
          TRACK SMARTER.
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Track workouts, build real progress, and share your journey.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/signup"
            className="bg-primary text-primary-foreground font-bold uppercase tracking-tighter px-10 py-4 md:px-12 md:py-5 hover:scale-105 active:scale-95 transition-transform border-2 border-transparent rounded-none text-base md:text-lg"
          >
            Start Tracking
          </a>
          <a
            href="#features"
            className="bg-transparent border-2 border-border text-foreground font-bold uppercase tracking-tighter px-10 py-4 md:px-12 md:py-5 hover:bg-foreground hover:text-background transition-colors rounded-none text-base md:text-lg"
          >
            See Features
          </a>
        </div>
      </div>
    </section>
  );
}
