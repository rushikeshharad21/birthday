import { motion } from "framer-motion";
import { fadeUp } from "../../animations/heroVariants";

export default function HeroSubtitle() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp(0.45)}
      aria-label="Birthday subtitle"
      className="mx-auto max-w-[650px] px-4 text-center"
    >
      <p className="text-base font-light leading-relaxed tracking-wide text-white/70 sm:text-lg md:text-xl">
        Every smile of yours fills our home with happiness.
      </p>

      <p className="mt-3 text-base font-light leading-relaxed tracking-wide text-white/60 sm:mt-4 sm:text-lg md:text-xl">
        Today isn&apos;t just your birthday —{" "}
        <br className="hidden sm:block" />
        it&apos;s a{" "}
        <strong className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text font-semibold text-transparent">
          celebration
        </strong>{" "}
        of the wonderful person you are.
      </p>
    </motion.section>
  );
}