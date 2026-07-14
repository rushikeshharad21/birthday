/**
 * heroVariants.js
 *
 * Centralized Framer Motion animation system.
 * Premium cinematic birthday storytelling — React + Framer Motion.
 *
 * Design language : elegant · emotional · luxurious · cinematic · minimal
 * Inspired by     : Apple · Framer · Linear · Stripe
 *
 * Every export is a factory function so callers can customise delay and
 * duration per usage site while sharing a consistent motion character.
 *
 * Usage:
 *   import { EASE, fadeUp, staggerContainer } from "@/animations/heroVariants";
 *
 *   <motion.section variants={staggerContainer()}>
 *     <motion.h1 variants={fadeUp(0, 1)}>Title</motion.h1>
 *     <motion.p  variants={fadeUp(0.15)}>Subtitle</motion.p>
 *   </motion.section>
 */

// ─────────────────────────────────────────────────────────────────────────────
// EASE
// Shared cubic-bezier curves. Import into any file that needs custom
// transitions so the project maintains a single easing vocabulary.
// ─────────────────────────────────────────────────────────────────────────────

export const EASE = {
  /** Fast start, silky deceleration — cinematic signature curve. */
  OUT: [0.16, 1, 0.3, 1],

  /** Symmetrical entry and exit — overlays, modals, layout shifts. */
  IN_OUT: [0.45, 0, 0.55, 1],

  /** Natural, unhurried flow — ambient motion and looping animations. */
  SMOOTH: [0.25, 0.46, 0.45, 0.94],
};

// ─────────────────────────────────────────────────────────────────────────────
// fadeUp
// Fade + gentle upward reveal. Primary entrance animation for headlines,
// body copy, and section entries.
//
// @param {number} delay    Seconds before the animation begins.  Default 0.
// @param {number} duration Animation duration in seconds.        Default 0.8.
// ─────────────────────────────────────────────────────────────────────────────

export const fadeUp = (delay = 0, duration = 0.8) => ({
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      delay,
      ease: EASE.OUT,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// fadeDown
// Fade + descending reveal. Navigation layers, top-anchored banners,
// and elements that drop into place from above.
//
// @param {number} delay    Seconds before the animation begins.  Default 0.
// @param {number} duration Animation duration in seconds.        Default 0.7.
// ─────────────────────────────────────────────────────────────────────────────

export const fadeDown = (delay = 0, duration = 0.7) => ({
  hidden: {
    opacity: 0,
    y: -24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      delay,
      ease: EASE.OUT,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// fadeIn
// Opacity only — no positional movement. Background overlays, ambient
// layers, and decorative elements where motion would feel intrusive.
//
// @param {number} delay    Seconds before the animation begins.  Default 0.
// @param {number} duration Animation duration in seconds.        Default 0.7.
// ─────────────────────────────────────────────────────────────────────────────

export const fadeIn = (delay = 0, duration = 0.7) => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration,
      delay,
      ease: EASE.IN_OUT,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// scaleIn
// Subtle scale-up + opacity fade. Elements materialise into existence.
// Intended for: photos, gallery cards, cake reveal, gift elements.
//
// @param {number} delay    Seconds before the animation begins.  Default 0.
// @param {number} duration Animation duration in seconds.        Default 0.7.
// ─────────────────────────────────────────────────────────────────────────────

export const scaleIn = (delay = 0, duration = 0.7) => ({
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration,
      delay,
      ease: EASE.OUT,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// buttonReveal
// Tailored for CTA buttons. Shorter travel distance and snappier timing
// make the button feel decisive and inviting rather than decorative.
//
// @param {number} delay Seconds before the animation begins. Default 0.
// ─────────────────────────────────────────────────────────────────────────────

export const buttonReveal = (delay = 0) => ({
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay,
      ease: EASE.OUT,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// staggerContainer
// Orchestrates sequential child entrance animations. The wrapper fades in
// so children never flash before their own animation begins.
// Pair with any child variant: fadeUp, fadeIn, scaleIn, etc.
//
// @param {number} stagger       Per-child stagger delay in seconds. Default 0.15.
// @param {number} delayChildren Delay before the first child starts. Default 0.1.
// ─────────────────────────────────────────────────────────────────────────────

export const staggerContainer = (stagger = 0.15, delayChildren = 0.1) => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// scrollIndicatorLoop
// Self-contained infinite float for scroll cues (arrows, chevrons).
// Keyframe arrays keep the loop perfectly seamless with no abrupt reset.
// Breathes on opacity; drifts gently on Y — present but never distracting.
//
// Apply directly (not inside a variants context):
//   <motion.div
//     initial={scrollIndicatorLoop.initial}
//     animate={scrollIndicatorLoop.animate}
//   />
// ─────────────────────────────────────────────────────────────────────────────

export const scrollIndicatorLoop = {
  initial: {
    opacity: 0.4,
    y: 0,
  },
  animate: {
    opacity: [0.4, 1, 0.4],
    y: [0, 10, 0],
    transition: {
      duration: 2.4,
      ease: EASE.SMOOTH,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};