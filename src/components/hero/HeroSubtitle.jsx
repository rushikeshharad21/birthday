import { motion } from "framer-motion";
import { fadeUp } from "../../animations/heroVariants";

export default function HeroSubtitle() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp(0.45)}
      aria-label="Birthday subtitle"
      className="mx-auto max-w-3xl px-6 text-center"
    >
      {/* Primary line */}
      <p
        className="
          text-lg
          sm:text-xl
          md:text-2xl

          font-light
          leading-relaxed
          tracking-[0.01em]

          text-white/80
        "
      >
        Every smile of yours fills our home with happiness.
      </p>

      {/* Secondary line */}
      <p
        className="
          mt-6

          text-base
          sm:text-lg
          md:text-xl

          font-light
          leading-8

          text-white/60
        "
      >
        Today isn't just your birthday—
        <br className="hidden sm:block" />
        it's a{" "}
        <span
          className="
            bg-gradient-to-r
            from-[#F5D38A]
            via-[#D4AF37]
            to-[#FFE8B8]

            bg-clip-text
            text-transparent

            font-semibold
          "
        >
          celebration
        </span>{" "}
        of the wonderful person you are.
      </p>
    </motion.section>
  );
}