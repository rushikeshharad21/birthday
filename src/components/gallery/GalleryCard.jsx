import { useLayoutEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Premium Gallery Card — 3D depth via two independent mechanisms so
 * neither fights the other over the same transform property:
 *
 * 1. SCROLL ENTRANCE (all devices, including mobile where hover doesn't
 *    exist): driven by GSAP ScrollTrigger with `scrub`, not a fixed-time
 *    animation. The card's slide/rotate/fade progress is tied DIRECTLY to
 *    scroll position within a window (roughly: from when the card's top
 *    enters the bottom of the viewport, to when it nears center) — so it
 *    genuinely moves as the person scrolls and pauses when they pause,
 *    rather than firing once on a timer. Each card has its own
 *    ScrollTrigger tied to its own position on the page, so cards further
 *    down the grid naturally reveal later as you keep scrolling — no
 *    artificial per-card delay needed for that "one by one" cascade
 *    anymore, it falls out of scrub + each card's real position.
 *
 * 2. POINTER TILT (desktop hover): unchanged from before — a separate
 *    inner <motion.div> tracks the cursor and tilts via spring-smoothed
 *    Framer Motion values. Kept on its own DOM node, deliberately never
 *    touching the same element GSAP animates, so the two systems don't
 *    fight over the same transform.
 *
 * Respects prefers-reduced-motion: the GSAP entrance is skipped entirely
 * (card just renders at rest) and the pointer tilt is disabled.
 */

const MAX_TILT_DEG = 8; // kept modest — reads as "premium subtle depth," not a gimmick
const IMAGE_PARALLAX_PX = 14; // how far the image shifts opposite the tilt, reinforcing depth
const SLIDE_DISTANCE_PX = 90; // how far off-screen (left/right) each card starts before sliding in
const ENTRANCE_TILT_DEG = 14; // subtle rotateY turn matching the slide direction, for a 3D "swinging in" feel rather than a flat slide

export default function GalleryCard({ photo, index = 0 }) {
  const { image, alt } = photo;
  const articleRef = useRef(null);
  const tiltRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const direction = index % 2 === 0 ? -1 : 1; // even -> from left, odd -> from right

  useLayoutEffect(() => {
    const element = articleRef.current;
    if (!element) return undefined;

    if (shouldReduceMotion) {
      gsap.set(element, { opacity: 1, x: 0, rotateY: 0, scale: 1 });
      return undefined;
    }

    gsap.set(element, {
      opacity: 0,
      x: direction * SLIDE_DISTANCE_PX,
      rotateY: direction * -ENTRANCE_TILT_DEG,
      scale: 0.94,
      transformPerspective: 1200,
    });

    const tween = gsap.to(element, {
      opacity: 1,
      x: 0,
      rotateY: 0,
      scale: 1,
      ease: "none", // scrub drives the timing directly from scroll position — an eased curve here would fight scrub's own linear-to-scroll mapping
      scrollTrigger: {
        trigger: element,
        start: "top 90%", // begins as soon as the card's top edge enters the bottom ~10% of the viewport
        end: "top 55%", // finishes once the card's top edge nears vertical center — a fairly short window so it doesn't feel sluggish
        scrub: 0.6, // slight smoothing lag (in seconds) rather than raw 1:1 pixel binding, so it still feels fluid rather than mechanically stepped
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [direction, shouldReduceMotion]);

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

  // A soft highlight that follows the pointer — reinforces the tilt as a
  // glossy 3D surface catching light, not just a flat card rotating.
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
    <article
      ref={articleRef}
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
          from the GSAP-driven entrance on the outer <article>. */}
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
    </article>
  );
}