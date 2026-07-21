import { useEffect, useState } from "react";
import FireworkLauncher from "../../three/particles/FireworkLauncher";
import { resolveBreakpoint } from "../../three/core/SceneCanvas";

/**
 * Owns a FireworkLauncher instance's lifecycle from the DOM side of the
 * app (this hook runs outside the Canvas, in FireworksTrigger). Returns
 * the current launcher (or null before the first effect has run) so the
 * caller can pass it down into whatever renders <FireworkSystem> inside
 * the shared SceneCanvas.
 *
 * Two separate concerns, deliberately kept in two separate effects:
 *
 *   1. Breakpoint tracking + launcher (re)creation — a launcher's pool
 *      capacities are fixed at construction (see FireworkLauncher.js), so
 *      crossing a breakpoint tier needs a fresh instance, not a resize of
 *      the existing one. Uses the SAME resolveBreakpoint() SceneCanvas
 *      uses, so this hook's tiering can never drift out of sync with the
 *      3D scene's own tiering.
 *
 *   2. Start/stop based on `isActive` — cheap, idempotent calls on
 *      whichever launcher currently exists; does not recreate anything.
 *
 * @param {boolean} isActive - whether the firework section is currently
 *   in the viewport (from useInViewport).
 * @returns {import("../../three/particles/FireworkLauncher").default | null}
 */
export default function useFireworkSequence(isActive) {
  const [breakpoint, setBreakpoint] = useState(() =>
    typeof window === "undefined" ? "desktop" : resolveBreakpoint(window.innerWidth)
  );
  const [launcher, setLauncher] = useState(null);

  useEffect(() => {
    function handleResize() {
      setBreakpoint((prev) => {
        const next = resolveBreakpoint(window.innerWidth);
        return next === prev ? prev : next;
      });
    }
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Recreates the launcher whenever the breakpoint TIER changes (not on
  // every resize event — setBreakpoint above only updates state when the
  // tier actually changes). The cleanup here is what satisfies "stop
  // launching, dispose all particles, reset timers" even when the reason
  // for tearing down is a tier change rather than leaving the section.
  useEffect(() => {
    const newLauncher = new FireworkLauncher(breakpoint);
    setLauncher(newLauncher);

    return () => {
      newLauncher.stop();
    };
  }, [breakpoint]);

  useEffect(() => {
    if (!launcher) return;
    if (isActive) {
      launcher.start();
    } else {
      launcher.stop();
    }
  }, [isActive, launcher]);

  return launcher;
}