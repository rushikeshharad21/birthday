import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.2,
  smoothWheel: true,
  smoothTouch: false,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }

    rafIdRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}