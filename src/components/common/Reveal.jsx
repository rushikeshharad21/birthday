import { motion, useInView, useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";
import { EASE } from "../../animations/heroVariants";

/**
 * Reveal
 *
 * Generic scroll-triggered reveal wrapper. Fades and translates children
 * into view once they enter the viewport, using a shared easing curve
 * for consistency with the rest of the motion system.
 *
 * Respects prefers-reduced-motion: renders children in their final
 * visible state immediately, with no transform or opacity transition.
 *
 * @param {React.ReactNode} children
 * @param {number} delay    Seconds before the animation starts.  Default 0.
 * @param {number} duration Animation duration in seconds.        Default 0.8.
 * @param {number} y        Initial vertical offset in pixels.    Default 40.
 * @param {boolean} once    Whether the reveal fires only once.    Default true.
 */
export default function Reveal({ children, delay = 0, duration = 0.8, y = 40, once = true }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const isInView = useInView(ref, {
    once,
    margin: "0px 0px -100px 0px",
  });

  // Variant shapes depend on props (y, duration, delay), so they're
  // recomputed per instance regardless of naming — memoized here to
  // avoid rebuilding the objects on every re-render of this instance.
  const variants = useMemo(
    () => ({
      hidden: { opacity: 0, y },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, delay, ease: EASE.OUT },
      },
    }),
    [y, duration, delay]
  );

  // Reduced motion: skip straight to the visible state with no
  // transition, while still returning the required motion.div.
  const animateState = shouldReduceMotion ? "visible" : isInView ? "visible" : "hidden";

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      animate={animateState}
    >
      {children}
    </motion.div>
  );
}