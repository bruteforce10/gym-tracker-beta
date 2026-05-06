export default function FinalCTA() {
  return (
    <section className="py-32 md:py-40 lg:py-48 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase tracking-tighter text-primary-foreground mb-6">
          START YOUR FIRST WORKOUT
        </h2>

        <p className="text-xl md:text-2xl lg:text-3xl text-primary-foreground/80 max-w-2xl mx-auto mb-12">
          Stop guessing. Start progressing.
        </p>

        <a
          href="/signup"
          className="inline-block bg-background text-primary font-bold uppercase tracking-tighter px-16 py-6 text-xl md:text-2xl hover:scale-105 active:scale-95 transition-transform rounded-none border-2 border-transparent"
        >
          GET STARTED
        </a>
      </div>
    </section>
  );
}
