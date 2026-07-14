import { motion } from "framer-motion";
import { buttonReveal } from "../../animations/heroVariants";

export default function HeroButton() {
  return (
    <motion.button
      type="button"
      initial="hidden"
      animate="visible"
      variants={buttonReveal(0.6)}
      className="cursor-pointer rounded-full border border-white/20 bg-white/10 px-10 py-4 text-sm font-semibold uppercase tracking-widest text-white shadow-lg shadow-black/30 backdrop-blur-md transition-transform transition-colors transition-shadow duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/30 hover:bg-white/15 hover:shadow-xl hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-0 active:scale-95 sm:px-12 sm:py-5 sm:text-base"
    >
      Begin the Journey
    </motion.button>
  );
}