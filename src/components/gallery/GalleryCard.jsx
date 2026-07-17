import { motion } from "framer-motion";
import Reveal from "../common/Reveal";
import { scaleIn } from "../../animations/heroVariants";

/**
 * GalleryCard
 *
 * Single gallery photo rendered as a premium image card. No caption,
 * overlay, icon, or text — image only, per design spec.
 *
 * Motion: Reveal handles the scroll-triggered viewport animation;
 * scaleIn() drives the image's entrance state (inherited from Reveal's
 * motion.div, no separate viewport trigger here). Hover lift/border/
 * shadow are plain CSS transitions, intentionally not whileHover, to
 * avoid a second Framer Motion interaction layer on top of the entry
 * animation — same reasoning applied to MemoryCard's hover state.
 *
 * @param {object} photo - { id, image, alt }
 */
export default function GalleryCard({ photo }) {
  const { image, alt } = photo;

  return (
    <Reveal>
      <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40">
        {/* ── Image ── */}
        <motion.div
          variants={scaleIn()}
          className="aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/5"
        >
          <img
            src={image}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transform-gpu transition-transform duration-500 ease-out group-hover:scale-105
"
          />
        </motion.div>
      </article>
    </Reveal>
  );
}
