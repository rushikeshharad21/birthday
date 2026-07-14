import HeroTitle from "./HeroTitle";
import HeroSubtitle from "./HeroSubtitle";
import HeroButton from "./HeroButton";
import ScrollIndicator from "./ScrollIndicator";

/**
 * Hero — full-viewport landing section.
 *
 * Composes:
 *   <HeroTitle />
 *   <HeroSubtitle />
 *   <HeroButton />
 *   <ScrollIndicator />
 *
 * Layout: dark cinematic luxury background built entirely from layered
 * CSS gradients (no images, no third-party animation libraries).
 */
export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className={[
        /* ── Sizing & stacking ── */
        "relative min-h-screen w-full overflow-hidden",

        /* ── Base dark background ── */
        "bg-[#080810]",
      ].join(" ")}
    >
      {/* ── Layered gradient atmosphere ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        {/* Radial warm-gold flare — top-left */}
        <div className="absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(180,130,40,0.18)_0%,transparent_70%)]" />

        {/* Radial cool-violet flare — bottom-right */}
        <div className="absolute -bottom-1/4 -right-1/4 h-[75%] w-[75%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(100,60,200,0.20)_0%,transparent_70%)]" />

        {/* Subtle deep-teal accent — bottom-left */}
        <div className="absolute -bottom-1/3 left-1/4 h-[55%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(20,140,140,0.12)_0%,transparent_65%)]" />

        {/* Fine horizontal luminance band across the midpoint */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgba(220,180,80,0.12)] to-transparent" />

        {/* Top-to-bottom vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Edge-darkening vignette (left + right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* ── Main content column ── */}
      <div
        className={[
          "relative z-10",
          "flex min-h-screen flex-col items-center justify-center",
          "mx-auto w-full max-w-6xl",
          "px-6 py-24 sm:px-10 md:px-16 lg:px-20",
          "gap-6 sm:gap-8",
        ].join(" ")}
      >
        {/* Primary heading */}
        <HeroTitle />

        {/* Supporting copy */}
        <HeroSubtitle />

        {/* Call-to-action */}
        <div className="mt-4 sm:mt-6">
          <HeroButton />
        </div>

        {/* Scroll affordance — pushed toward the bottom of the viewport */}
        <div className="mt-auto pt-16 sm:pt-20">
          <ScrollIndicator />
        </div>
      </div>
    </section>
  );
}