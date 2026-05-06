import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FEATURES } from "../constants";

const FEATURE_MEDIA = [
  {
    src: "/feature-mockup/gambar 01.webp",
    width: 1419,
    height: 2796,
    cta: "Start Tracking",
    rotation: "rotate-[5deg]",
  },
  {
    src: "/feature-mockup/gambar 02.webp",
    width: 1419,
    height: 2796,
    cta: "View Plans",
    rotation: "-rotate-[6deg]",
  },
  {
    src: "/feature-mockup/gambar 03.webp",
    width: 1419,
    height: 2796,
    cta: "Set Goal",
    rotation: "rotate-[4deg]",
  },
  {
    src: "/feature-mockup/gambar 04.webp",
    width: 1159,
    height: 1888,
    cta: "Share To Feed",
    rotation: "-rotate-[5deg]",
  },
  {
    src: "/feature-mockup/gambar 05.webp",
    width: 1419,
    height: 2796,
    cta: "Track Live",
    rotation: "rotate-[5deg]",
  },
] as const;

export default function FeatureSections() {
  return (
    <section
      id="features"
      className="relative isolate overflow-x-hidden bg-[#020403] text-white"
      aria-label="Fitur utama Grynx"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.13),transparent_34%),linear-gradient(180deg,#020403_0%,#050806_100%)]" />

      {FEATURES.map((feature, index) => {
        const media = FEATURE_MEDIA[index];
        const imageFirst = index % 2 === 1;

        return (
          <article
            key={feature.id}
            className="group relative min-h-[640px] overflow-hidden border-t border-white/[0.16] md:min-h-[430px] lg:min-h-[500px]"
          >
            <div
              className={`absolute inset-y-0 ${
                imageFirst ? "left-0" : "right-0"
              } w-full bg-[radial-gradient(circle,rgba(0,255,91,0.25)_0%,rgba(16,185,129,0.11)_28%,transparent_63%)] opacity-70 blur-2xl md:w-1/2`}
              aria-hidden="true"
            />

            <div className="container relative z-10 mx-auto grid min-h-[640px] grid-cols-1 px-5 md:min-h-[430px] md:grid-cols-2 md:px-8 lg:min-h-[500px]">
              <div
                className={`flex min-w-0 flex-col justify-center py-12 md:py-16 lg:py-20 ${
                  imageFirst ? "md:order-2 md:pl-14" : "md:order-1 md:pr-14"
                }`}
              >
                <div
                  className="motion-safe:animate-fade-in-up"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <p className="font-data mb-5 text-4xl font-extrabold leading-none text-primary tabular-nums md:text-5xl">
                    {feature.number}
                  </p>

                  <h2 className="max-w-[11ch] text-balance font-heading text-5xl font-black uppercase leading-[0.88] tracking-normal text-white drop-shadow-[0_3px_0_rgba(255,255,255,0.16)] sm:text-6xl md:text-6xl lg:text-7xl">
                    {feature.title}
                  </h2>

                  <p className="mt-7 max-w-[26rem] text-pretty text-lg leading-8 text-white/[0.82] md:text-xl">
                    {feature.description}
                  </p>

                  <a
                    href="/signup"
                    className="mt-8 inline-flex min-h-11 w-fit items-center gap-4 text-base font-extrabold uppercase tracking-normal text-primary outline-offset-4 transition-[color] duration-200 hover:text-emerald-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none md:text-lg"
                  >
                    <span>{media.cta}</span>
                    <ArrowRight
                      className="size-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>

              <div
                className={`relative min-h-[320px] md:min-h-0 ${
                  imageFirst ? "md:order-1" : "md:order-2"
                }`}
              >
                <div
                  className={`absolute bottom-[-118px] ${
                    imageFirst
                      ? "left-1/2 md:left-5 lg:left-12"
                      : "left-1/2 md:left-auto md:right-4 lg:right-14"
                  } w-[min(74vw,300px)] -translate-x-1/2 md:bottom-[-170px] md:w-[min(36vw,340px)] md:translate-x-0 lg:bottom-[-210px] lg:w-[min(34vw,390px)]`}
                >
                  <div className="absolute inset-8 rounded-[3rem] bg-primary/[0.35] blur-3xl transition-opacity duration-300 group-hover:opacity-80 motion-reduce:transition-none" />
                  <Image
                    src={media.src}
                    alt={feature.imageAlt}
                    width={media.width}
                    height={media.height}
                    priority={index < 2}
                    sizes="(min-width: 1024px) 390px, (min-width: 768px) 34vw, 74vw"
                    className={`relative h-auto w-full select-none drop-shadow-[0_30px_70px_rgba(0,0,0,0.82)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${media.rotation} group-hover:translate-y-[-10px] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0`}
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
