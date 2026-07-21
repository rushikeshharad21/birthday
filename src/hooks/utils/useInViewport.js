import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is in the viewport, via a plain
 * IntersectionObserver — not a Lenis-specific scroll listener.
 *
 * This is deliberate, not an oversight: this project's SmoothScrollProvider
 * configures Lenis WITHOUT `wrapper`/`content` options, so Lenis smooths
 * native window scrolling (interpolated `window.scrollTo` calls) rather
 * than transform-ing a wrapper div. getBoundingClientRect() (which
 * IntersectionObserver relies on internally) reflects real scroll
 * position correctly under that setup. If this project's Lenis config
 * ever changes to a wrapper/content virtual-scroll setup, this hook would
 * need to switch to Lenis's own `scroll` event instead — worth
 * re-checking this comment against SmoothScrollProvider.jsx if viewport
 * triggers ever start firing at the wrong scroll position.
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=0.4] - fraction of the element that
 *   must be visible to count as "in view" (0.4 = 40%).
 * @param {string} [options.rootMargin="0px"] - standard IntersectionObserver
 *   rootMargin, e.g. "-10% 0px" to require the element be well past the
 *   viewport edge before triggering.
 * @returns {[React.RefObject, boolean]} - [ref to attach to the target
 *   element, whether it's currently in view]
 */
export default function useInViewport({ threshold = 0.4, rootMargin = "0px" } = {}) {
  const elementRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      // SSR or an unsupported browser — fail open (treat as always in
      // view) rather than silently disabling the feature entirely.
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [elementRef, isInView];
}