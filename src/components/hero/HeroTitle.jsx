import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/heroVariants";

/**
 * HeroTitle
 *
 * Luxury cinematic birthday title section.
 * Semantic HTML · Tailwind CSS · Framer Motion.
 * No icons · No images.
 */
export default function HeroTitle() {
  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={staggerContainer()}
      className="flex flex-col items-center gap-6 text-center sm:gap-8"
    >

      {/* ── Eyebrow label ── */}
      <motion.p
        variants={fadeUp(0)}
        aria-label="For someone very special"
        className="flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.30em] text-amber-400/70"
      >
        {/* Decorative side rules */}
        <span
          aria-hidden="true"
          className="block h-px w-8 bg-gradient-to-r from-transparent to-amber-400/50 sm:w-12"
        />
        For Someone Very Special
        <span
          aria-hidden="true"
          className="block h-px w-8 bg-gradient-to-l from-transparent to-amber-400/50 sm:w-12"
        />
      </motion.p>

      {/* ── Main heading ── */}
      <motion.h1 variants={fadeUp(0.15)} className="flex flex-col items-center gap-2 sm:gap-3">

        {/* Line 1 — Happy Birthday */}
        <span className="block font-extrabold leading-none tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
          Happy Birthday
        </span>

        {/* Line 2 — My Dear Sister ❤️ */}
        <span className="block font-extrabold leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-br from-rose-200 via-pink-300 to-rose-400 bg-clip-text text-transparent">
          My Dear Sister
        </span>
      </motion.h1>

      {/* ── Glowing divider ── */}
      <motion.div
        variants={fadeUp(0.3)}
        aria-hidden="true"
        className="relative flex items-center justify-center"
      >
        {/* Soft blur glow behind the line */}
        <div className="absolute h-2 w-32 rounded-full bg-amber-300/30 blur-md sm:w-48" />

        {/* The actual line */}
        <hr className="relative border-none h-px w-32 sm:w-48 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      </motion.div>

    </motion.header>
  );
}