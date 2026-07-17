import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
damping: 30,
mass: 0.2,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "left center" }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
    />
  );
}