import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../../animations/heroVariants";

/**
 * HeroBackground
 *
 * Decorative ambient background for the cinematic hero section.
 * Pure CSS gradients animated with Framer Motion — no images, SVG,
 * canvas, or particle libraries. Motion is restricted to slow,
 * small-amplitude translation on the glow layers only; the base,
 * streak, and vignettes remain static to anchor the composition.
 *
 * This component owns background rendering only. It is intended to
 * sit as an absolutely-positioned layer behind Hero.jsx content and
 * does not manage layout, spacing, or foreground content.
 *
 * Respects prefers-reduced-motion: glow layers stay visible but static
 * (no translation) when the user has reduced motion enabled.
 */
export default function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* ── Base layer ── */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* ── Warm gold radial glow ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-1/4 -top-1/4 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(217,155,64,0.18),transparent_65%)] blur-3xl transform-gpu sm:h-[55vw] sm:w-[55vw]"
        initial={{ x: 0, y: 0 }}
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: [0, 30, -10, 0], y: [0, 20, 40, 0] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 26, ease: EASE.SMOOTH, repeat: Infinity, repeatType: "loop" }
        }
      />

      {/* ── Violet radial glow ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-[65vw] w-[65vw] rounded-full bg-[radial-gradient(circle,rgba(124,92,224,0.16),transparent_65%)] blur-3xl transform-gpu sm:h-[50vw] sm:w-[50vw]"
        initial={{ x: 0, y: 0 }}
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: [0, -25, 15, 0], y: [0, -30, -10, 0] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 32, ease: EASE.SMOOTH, repeat: Infinity, repeatType: "loop" }
        }
      />

      {/* ── Soft teal accent glow ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[40vw] w-[40vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,180,0.10),transparent_70%)] blur-3xl transform-gpu sm:h-[32vw] sm:w-[32vw]"
        initial={{ x: 0, y: 0 }}
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: [0, 18, -18, 0], y: [0, -15, 15, 0] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 21, ease: EASE.SMOOTH, repeat: Infinity, repeatType: "loop" }
        }
      />

      {/* ── Horizontal light streak ── */}
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Top / bottom vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70" />

      {/* ── Left / right vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
    </div>
  );
}