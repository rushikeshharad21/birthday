import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../../animations/heroVariants";

/**
 * HeroBackground
 *
 * Premium cinematic ambient background.
 * Apple × Stripe × Linear inspired.
 * Architecture unchanged — visual quality improved.
 */

export default function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#08070D]" />

      {/* Warm luxury gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,232,184,0.08),transparent_55%)]" />

      {/* Gold Glow */}
      <motion.div
        className="
          absolute
          -left-1/4
          -top-1/4

          h-[72vw]
          w-[72vw]

          rounded-full

          bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_70%)]

          blur-[140px]
        "
        initial={{ x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0 }
            : {
                x: [0, 40, -20, 0],
                y: [0, 25, 45, 0],
              }
        }
        transition={{
          duration: 28,
          ease: EASE.SMOOTH,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />

      {/* Champagne Glow */}
      <motion.div
        className="
          absolute
          right-[-18%]
          top-[8%]

          h-[40vw]
          w-[40vw]

          rounded-full

          bg-[radial-gradient(circle,rgba(255,240,220,0.10),transparent_72%)]

          blur-[120px]
        "
        initial={{ x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0 }
            : {
                x: [0, -25, 10, 0],
                y: [0, 20, -15, 0],
              }
        }
        transition={{
          duration: 24,
          ease: EASE.SMOOTH,
          repeat: Infinity,
        }}
      />

      {/* Violet Accent */}
      <motion.div
        className="
          absolute
          right-[-22%]
          bottom-[-22%]

          h-[60vw]
          w-[60vw]

          rounded-full

          bg-[radial-gradient(circle,rgba(124,92,224,0.14),transparent_72%)]

          blur-[140px]
        "
        initial={{ x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0 }
            : {
                x: [0, -35, 18, 0],
                y: [0, -30, -10, 0],
              }
        }
        transition={{
          duration: 34,
          ease: EASE.SMOOTH,
          repeat: Infinity,
        }}
      />

      {/* Teal Accent */}
      <motion.div
        className="
          absolute
          left-1/2
          top-[40%]

          h-[34vw]
          w-[34vw]

          -translate-x-1/2

          rounded-full

          bg-[radial-gradient(circle,rgba(70,180,170,0.09),transparent_72%)]

          blur-[120px]
        "
        initial={{ x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0 }
            : {
                x: [0, 20, -18, 0],
                y: [0, -18, 12, 0],
              }
        }
        transition={{
          duration: 22,
          ease: EASE.SMOOTH,
          repeat: Infinity,
        }}
      />

      {/* Premium center light */}
      <div
        className="
          absolute
          left-1/2
          top-[45%]

          h-[2px]
          w-[65%]

          -translate-x-1/2

          bg-gradient-to-r
          from-transparent
          via-white/15
          to-transparent
        "
      />

      {/* Soft grid */}
      <div
        className="
          absolute
          inset-0

          opacity-[0.035]

          [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)]

          [background-size:80px_80px]
        "
      />

      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />

      {/* Bottom transition into cream */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#faf6f0]/20 to-[#FAF6F0]" />

      {/* Side vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/55" />
    </div>
  );
}