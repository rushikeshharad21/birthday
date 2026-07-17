import { motion } from "framer-motion";
import Reveal from "../common/Reveal";
import { fadeUp, scaleIn } from "../../animations/heroVariants";

/**
 * MemoryCard
 *
 * Single memory entry in an alternating two-column storytelling layout.
 * Desktop/tablet: image and content sit side by side, order controlled
 * by `reverse`. Mobile: always stacked, image first.
 *
 * Motion: the whole card fades/translates in via <Reveal>; image and
 * content animate independently within that reveal using shared
 * scaleIn/fadeUp variants (state propagates down from Reveal's
 * motion.div). Hover lift is a plain CSS transition, not a Framer
 * Motion interaction state, to avoid stacking a fourth motion source
 * on top of the entry animation.
 *
 * @param {object} memory - { image, alt, title, description, year }
 * @param {boolean} reverse - flips column order on desktop/tablet
 */
export default function MemoryCard({ memory, reverse = false }) {
    if (!memory) return null;
  const { image, alt, title, description, year } = memory;

  return (
    <Reveal>
      <article
        className="group grid grid-cols-1 overflow-hidden items-center gap-8 rounded-3xl border border-white/8 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,.35)] shadow-black/30 backdrop-blur-md transition-transform duration-300 ease-out hover:-translate-y-2 hover:border-white/15 hover:shadow-xl hover:shadow-black/40 sm:p-8 md:grid-cols-2 md:gap-12 md:p-10"
      >

        {/* ── Image ── */}
        <motion.div
          variants={scaleIn()}
          className={`aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 ${
            reverse ? "md:order-2" : "md:order-1"
          }`}
        >
          <img
            src={image}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </motion.div>

        {/* ── Content ── */}
        <motion.div
          variants={fadeUp(0.15)}
          className={`flex flex-col gap-4 ${reverse ? "md:order-1" : "md:order-2"}`}
        >

          {/* Year badge — only when provided */}
          {year && (
            <span className="w-fit rounded-full border border-amber-400/30 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-amber-400/80">
              {year}
            </span>
          )}

          {/* Decorative divider */}
          <div
            aria-hidden="true"
            className="h-px w-16 bg-gradient-to-r from-amber-300/80 to-transparent"
          />

          {/* Title */}
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-transparent bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text sm:text-3xl md:text-4xl">
            {title}
          </h3>

          {/* Description */}
          <p className="text-base font-light leading-relaxed tracking-wide text-white/70 sm:text-lg">
            {description}
          </p>

        </motion.div>

      </article>
    </Reveal>
  );
}