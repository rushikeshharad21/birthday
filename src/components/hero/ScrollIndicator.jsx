import { motion } from "framer-motion";
import { scrollIndicatorLoop } from "../../animations/heroVariants";

export default function ScrollIndicator() {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-light uppercase tracking-widest text-white/40">
        Scroll to Begin
      </p>

      {/* Mouse outline */}
      <motion.div
        initial={scrollIndicatorLoop.initial}
        animate={scrollIndicatorLoop.animate}
        aria-hidden="true"
        className="flex h-10 w-6 items-start justify-center rounded-full border border-white/25 pt-2"
      >
        {/* Scroll-wheel dot */}
        <div className="h-1.5 w-1 rounded-full bg-white/40" />
      </motion.div>
    </div>
  );
}