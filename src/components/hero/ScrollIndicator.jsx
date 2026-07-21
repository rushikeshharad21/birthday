import { motion } from "framer-motion";
import { scrollIndicatorLoop } from "../../animations/heroVariants";

export default function ScrollIndicator() {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Label */}
      <p
        className="
          text-[11px]
          font-medium
          uppercase
          tracking-[0.35em]

          text-white/45

          transition-colors
          duration-300
        "
      >
        Scroll to Begin
      </p>

      {/* Mouse */}
      <motion.div
        initial={scrollIndicatorLoop.initial}
        animate={scrollIndicatorLoop.animate}
        aria-hidden="true"
        className="
          relative

          flex
          h-14
          w-8

          items-start
          justify-center

          rounded-full

          border
          border-white/20

          bg-white/[0.03]
          backdrop-blur-xl

          pt-3

          shadow-[0_10px_30px_rgba(0,0,0,0.25)]
        "
      >
        {/* Inner Glow */}
        <div
          className="
            absolute
            inset-0

            rounded-full

            bg-gradient-to-b
            from-white/10
            via-transparent
            to-transparent

            pointer-events-none
          "
        />

        {/* Scroll Wheel */}
        <motion.div
          initial={{ y: 0, opacity: 0.7 }}
          animate={{
            y: [0, 10, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            h-2.5
            w-1.5

            rounded-full

            bg-gradient-to-b
            from-[#F5D38A]
            to-[#D4AF37]

            shadow-[0_0_10px_rgba(212,175,55,0.6)]
          "
        />
      </motion.div>

      {/* Bottom Hint */}
      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="
          h-5
          w-px

          bg-gradient-to-b
          from-[#D4AF37]
          to-transparent
        "
      />
    </div>
  );
}