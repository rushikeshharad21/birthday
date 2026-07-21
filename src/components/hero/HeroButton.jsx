import { motion } from "framer-motion";
import { buttonReveal } from "../../animations/heroVariants";

export default function HeroButton() {
  return (
    <motion.button
      type="button"
      initial="hidden"
      animate="visible"
      variants={buttonReveal(0.6)}
      className="
        group
        relative
        overflow-hidden

        cursor-pointer
        rounded-full

        border
        border-white/15

        bg-white/[0.08]
        backdrop-blur-2xl

        px-10
        py-4

        sm:px-12
        sm:py-5

        text-sm
        sm:text-base

        font-semibold
        uppercase
        tracking-[0.25em]

        text-[#FFF8F0]

        shadow-[0_12px_40px_rgba(0,0,0,0.35)]

        transition-all
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:-translate-y-1
        hover:scale-[1.02]

        hover:border-[#D4AF37]
        hover:bg-white/[0.12]

        hover:shadow-[0_20px_60px_rgba(212,175,55,0.18)]

        active:scale-[0.98]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#D4AF37]
        focus-visible:ring-offset-2
        focus-visible:ring-offset-transparent
      "
    >
      {/* Gold glow */}
      <span
        className="
          absolute
          inset-0

          opacity-0

          transition-opacity
          duration-500

          group-hover:opacity-100

          bg-gradient-to-r
          from-transparent
          via-[#D4AF37]/10
          to-transparent
        "
      />

      {/* Glass reflection */}
      <span
        className="
          absolute
          inset-0

          bg-gradient-to-b
          from-white/20
          via-transparent
          to-transparent

          pointer-events-none
        "
      />

      {/* Button text */}
      <span className="relative z-10">
        Begin the Journey
      </span>
    </motion.button>
  );
}