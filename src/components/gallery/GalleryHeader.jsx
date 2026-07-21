import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/heroVariants";

export default function GalleryHeader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="gallery-heading"
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer()}
      className="relative flex flex-col items-center text-center"
    >
      {/* Badge */}
      <motion.div variants={fadeUp(0)}>
        <span
          style={{
            color: "#C9A96E",
            border: "1px solid #DCC9B4",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          className="rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] shadow-lg"
        >
          Gallery

        </span>
      </motion.div>
      <br/>

      {/* Heading */}
      <motion.h2
        id="gallery-heading"
        variants={fadeUp(0.15)}
        style={{
          color: "#2C2420",
          fontWeight: 900,
          textShadow: "0 2px 12px rgba(255,255,255,.35)",
        }}
        className="mt-8 text-5xl leading-[0.9] tracking-[-0.05em] sm:text-6xl md:text-7xl lg:text-8xl"
      >
        Captured
        <br />
        Beautiful Moments
      </motion.h2>

      {/* Divider */}
      <motion.div
        variants={fadeUp(0.22)}
        className="mt-8 flex items-center gap-4"
      >
        <div className="h-px w-20 bg-[#C9A96E]/40" />
        <div className="h-2 w-2 rounded-full bg-[#C9A96E]" />
        <div className="h-px w-20 bg-[#C9A96E]/40" />
      </motion.div>

      {/* Paragraph */}
      <motion.p
        variants={fadeUp(0.3)}
        style={{
          color: "#6B5E54",
        }}
        className="mt-8 max-w-3xl text-lg leading-9 sm:text-xl"
      >
        Every photograph tells a story worth remembering.
        <br className="hidden sm:block" />
        Each smile, every laugh, and every shared moment becomes a timeless
        memory that lives forever.
      </motion.p>
    </motion.section>
  );
}