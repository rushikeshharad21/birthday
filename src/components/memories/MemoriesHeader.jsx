import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/heroVariants";

/**
 * MemoriesHeader
 *
 * Premium luxury section header
 * Designed for warm cream background.
 */

export default function MemoriesHeader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="memories-heading"
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer()}
      className="flex flex-col items-center gap-6 px-6 py-24 text-center sm:gap-8 sm:px-10 md:px-16 lg:px-20"
    >
      {/* Eyebrow */}

      <motion.div variants={fadeUp(0)}>
        <span
          className="
            inline-flex
            items-center

            rounded-full

            border
            border-[#DCC9B4]

            bg-white/60
            backdrop-blur-xl

            px-6
            py-2

            text-xs
            font-semibold
            uppercase
            tracking-[0.35em]

            text-[#C9A96E]

            shadow-[0_8px_30px_rgba(44,36,32,0.05)]
          "
        >
          Our Memories
        </span>
      </motion.div>

      {/* Heading */}

      <motion.h2
        id="memories-heading"
        variants={fadeUp(0.15)}
        style={{
          color: "#2C2420",
          textShadow: "0 2px 10px rgba(255,255,255,.35)",
        }}
        className="
          max-w-5xl

          text-5xl
          font-black
          leading-[0.92]
          tracking-[-0.05em]

          sm:text-6xl
          md:text-7xl
          lg:text-8xl

          mt-6
        "
      >
        A Journey Through
        <br />
        Beautiful Moments
      </motion.h2>

      {/* Luxury Divider */}

      <motion.div
        variants={fadeUp(0.22)}
        className="flex items-center gap-4 mt-2"
      >
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

        <div className="h-2 w-2 rounded-full bg-[#C9A96E]" />

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
      </motion.div>

      {/* Description */}

      <motion.p
        variants={fadeUp(0.3)}
        style={{
          color: "#6B5E54",
        }}
        className="
          max-w-[700px]

          text-lg
          font-normal
          leading-9

          sm:text-xl
          mt-2
        "
      >
        Every smile, every laugh, and every shared moment has become part of a
        story we'll cherish forever.
      </motion.p>
    </motion.section>
  );
}