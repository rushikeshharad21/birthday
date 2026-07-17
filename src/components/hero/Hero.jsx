import HeroTitle from "./HeroTitle";
import HeroSubtitle from "./HeroSubtitle";
import HeroButton from "./HeroButton";
import ScrollIndicator from "./ScrollIndicator";
import HeroBackground from "./HeroBackground";

/**
 * Hero — full-viewport landing section.
 *
 * Composes:
 *   <HeroBackground />
 *   <HeroTitle />
 *   <HeroSubtitle />
 *   <HeroButton />
 *   <ScrollIndicator />
 *
 * Layout: dark cinematic luxury background rendered by HeroBackground
 * (layered, animated CSS gradients — no images, no third-party
 * animation libraries beyond Framer Motion).
 */
export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-screen w-full overflow-hidden bg-[#080810]"
    >
      {/* ── Ambient background ── */}
      <HeroBackground />

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