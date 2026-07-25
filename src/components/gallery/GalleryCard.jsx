import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * Premium Gallery Card — 3D depth via two independent mechanisms so
 * neither fights the other over the same transform property:
 *
 * 1. SCROLL ENTRANCE: alternating left/right slide-in with a subtle
 *    rotateY turn, driven by Framer Motion's `whileInView` — deliberately
 *    NOT GSAP/ScrollTrigger. Framer Motion is already a dependency for
 *    the rest of the site (Hero, Reveal, etc.), so using it here adds
 *    zero new bundle weight to this early-loading section, unlike GSAP
 *    which was landing in the critical render path (see perf notes).
 *
 * 2. POINTER TILT (desktop hover): a separate inner <motion.div> tracks
 *    the cursor and tilts via spring-smoothed motion values in `style`.
 *    Kept on its own DOM node so it never competes with the entrance
 *    animation over the same transform property.
 *
 * Respects prefers-reduced-motion: both collapse to a simple fade.
 */

const MAX_TILT_DEG = 8; // kept modest — reads as "premium subtle depth," not a gimmick
const IMAGE_PARALLAX_PX = 14; // how far the image shifts opposite the tilt, reinforcing depth
const SLIDE_DISTANCE_PX = 90; // how far off-screen (left/right) each card starts before sliding in
const ENTRANCE_TILT_DEG = 14; // subtle rotateY turn matching the slide direction, for a 3D "swinging in" feel rather than a flat slide

/**
 * `direction`: -1 = enters from the left, 1 = enters from the right.
 * Alternating by index (even -> left, odd -> right) produces the
 * "some from left, some from right" cascade down the grid.
 */
function entranceVariants(reduced, direction) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5 } },
    };
  }
  return {
    hidden: {
      opacity: 0,
      x: direction * SLIDE_DISTANCE_PX,
      rotateY: direction * -ENTRANCE_TILT_DEG,
      scale: 0.94,
    },
    visible: {
      opacity: 1,
      x: 0,
      rotateY: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export default function GalleryCard({ photo, index = 0 }) {
  const { image, alt } = photo;
  const tiltRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const direction = index % 2 === 0 ? -1 : 1; // even -> from left, odd -> from right

  // Raw pointer position within the tilt layer, normalized to -0.5..0.5.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.5 };
  const tiltRotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [MAX_TILT_DEG, -MAX_TILT_DEG]),
    springConfig
  );
  const tiltRotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-MAX_TILT_DEG, MAX_TILT_DEG]),
    springConfig
  );
  const imageX = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [IMAGE_PARALLAX_PX, -IMAGE_PARALLAX_PX]),
    springConfig
  );
  const imageY = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [IMAGE_PARALLAX_PX, -IMAGE_PARALLAX_PX]),
    springConfig
  );

  const glowX = useTransform(pointerX, [-0.5, 0.5], ["15%", "85%"]);
  const glowY = useTransform(pointerY, [-0.5, 0.5], ["15%", "85%"]);
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.35), transparent 55%)`
  );

  function handlePointerMove(event) {
    if (shouldReduceMotion) return;
    const bounds = tiltRef.current?.getBoundingClientRect();
    if (!bounds) return;
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <motion.article
      variants={entranceVariants(shouldReduceMotion, direction)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      style={{ transformPerspective: 1200 }}
      className="
        group
        relative
        overflow-hidden
        rounded-[30px]

        bg-white/20
        backdrop-blur-xl

        border
        border-white/40

        shadow-[0_12px_45px_rgba(44,36,32,0.08)]

        transition-shadow
        duration-700
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:shadow-[0_28px_70px_rgba(44,36,32,0.15)]
        hover:border-[#d6b77d]
      "
    >
      {/* Soft border glow */}
      <div
        className="
          absolute
          inset-0
          rounded-[30px]

          bg-gradient-to-br
          from-white/30
          via-transparent
          to-[#f5ede3]/20

          pointer-events-none
        "
      />

      {/* Tilt layer — pointer-driven 3D rotation, deliberately separate
          from the entrance animation on the outer <motion.article>. */}
      <motion.div
        ref={tiltRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        style={{
          rotateX: shouldReduceMotion ? 0 : tiltRotateX,
          rotateY: shouldReduceMotion ? 0 : tiltRotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 900,
        }}
        className="relative"
      >
        {/* Pointer-following glossy highlight */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[30px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />

        <motion.div
          style={{
            x: shouldReduceMotion ? 0 : imageX,
            y: shouldReduceMotion ? 0 : imageY,
          }}
          className="
            relative
            aspect-[4/5]
            overflow-hidden
            rounded-[26px]
            m-[5px]
          "
        >
          <img
            src={image}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full
              object-cover
              scale-105

              transition-all
              duration-700
              ease-[cubic-bezier(0.22,1,0.36,1)]

              group-hover:scale-110
              group-hover:brightness-[1.06]
              group-hover:contrast-[1.05]
              group-hover:saturate-[1.08]
            "
          />

          {/* Luxury fade */}
          <div
            className="
              absolute
              inset-0

              bg-gradient-to-t
              from-black/12
              via-transparent
              to-white/10

              opacity-0
              transition-opacity
              duration-500

              group-hover:opacity-100
            "
          />

          {/* Glass Reflection */}
          <div
            className="
              absolute
              inset-0

              bg-gradient-to-br
              from-white/30
              via-white/5
              to-transparent

              opacity-70
              pointer-events-none
            "
          />
        </motion.div>
      </motion.div>
    </motion.article>
  );
}