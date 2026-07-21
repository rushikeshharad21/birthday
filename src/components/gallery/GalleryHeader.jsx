import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/heroVariants";

/**
 * GalleryHeader
 *
 * Section header introducing the "Gallery" storytelling block.
 * Semantic HTML · Tailwind CSS · Framer Motion.
 * Animates in on scroll (once), staggering eyebrow, heading, and
 * paragraph in sequence via shared fadeUp/staggerContainer variants.
 *
 * Respects prefers-reduced-motion: renders directly in its final
 * visible state with no scroll-triggered transition.
 */
export default function GalleryHeader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="gallery-heading"
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer()}
      className="flex flex-col items-center gap-6 px-6 py-24 text-center sm:gap-8 sm:px-10 md:px-16 lg:px-20"
    >

      {/* ── Eyebrow label ── */}
      <motion.p
        variants={fadeUp(0)}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.30em] text-amber-400/70"
      >
        Gallery
      </motion.p>

      {/* ── Main heading ── */}
      
      <motion.h2
        id="gallery-heading"
        variants={fadeUp(0.15)}
        className="text-4xl font-extrabold leading-tight tracking-tight text-transparent bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Captured
        <br />
        Beautiful Moments
      </motion.h2>

      {/* ── Supporting paragraph ── */}
      <motion.p
        variants={fadeUp(0.3)}
        className="max-w-[42rem] text-base font-light leading-relaxed tracking-wide text-white/70 sm:text-lg md:text-xl"
      >
        Every photograph holds a story,
<br className="hidden sm:block" />
every smile preserves a memory that lives forever.
      </motion.p>

    </motion.section>
  );
}