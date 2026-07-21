import HeroTitle from "./HeroTitle";
import HeroSubtitle from "./HeroSubtitle";
import HeroButton from "./HeroButton";
import ScrollIndicator from "./ScrollIndicator";
import HeroBackground from "./HeroBackground";

/**
 * Hero
 *
 * Cinematic luxury introduction.
 * Dark Hero → Warm Storytelling transition.
 */

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="
        relative
        isolate

        min-h-screen
        w-full

        overflow-hidden

        bg-[#07070B]
      "
    >
      {/* Ambient Background */}
      <HeroBackground />

      {/* Bottom fade into cream section */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-52
          bg-gradient-to-b
          from-transparent
          via-[#f8f4ee]/40
          to-[#FAF6F0]
          z-10
        "
      />

      {/* Hero Content */}
      <div
        className="
          relative
          z-20

          mx-auto
          flex
          min-h-screen
          w-full
          max-w-7xl

          flex-col
          items-center
          justify-center

          px-6
          py-24

          sm:px-10
          md:px-16
          lg:px-20
        "
      >
        <HeroTitle />

        <div className="mt-8">
          <HeroSubtitle />
        </div>

        <div className="mt-10">
          <HeroButton />
        </div>

        <div className="mt-auto pt-20">
          <ScrollIndicator />
        </div>
      </div>
    </section>
  );
}