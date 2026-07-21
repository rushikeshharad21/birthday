import useInViewport from "../../hooks/utils/useInViewport";
import useFireworkSequence from "../../hooks/animations/useFireworkSequence";

/**
 * Thin DOM-level orchestrator. Watches whether this section is in the
 * viewport (useInViewport) and drives a FireworkLauncher's start/stop
 * lifecycle accordingly (useFireworkSequence).
 *
 * Deliberately does NOT render anything inside a Canvas itself — a plain
 * DOM component can't render Three.js objects (React Three Fiber's
 * reconciler, not the DOM one, owns everything inside <Canvas>). Instead
 * it exposes the resulting `launcher` instance to its children via a
 * render-prop; the consumer (BirthdayCake.jsx) passes that launcher down
 * into <CakeScene>, which renders <FireworkSystem> inside the shared
 * SceneCanvas.
 *
 * `launcher` will be `null` on first render (before useFireworkSequence's
 * effect has created one) — consumers should render conditionally.
 *
 * @param {Object} props
 * @param {(launcher: import("../../three/particles/FireworkLauncher").default | null) => React.ReactNode} props.children
 * @param {number} [props.viewportThreshold=0.3] - fraction of the section
 *   that must be visible before fireworks start.
 * @param {...any} props.sectionProps - spread onto the underlying
 *   <section> (aria-label, className, etc.)
 */
export default function FireworksTrigger({
  children,
  viewportThreshold = 0.3,
  ...sectionProps
}) {
  const [sectionRef, isInView] = useInViewport({ threshold: viewportThreshold });
  const launcher = useFireworkSequence(isInView);

  return (
    <section ref={sectionRef} {...sectionProps}>
      {children(launcher)}
    </section>
  );
}