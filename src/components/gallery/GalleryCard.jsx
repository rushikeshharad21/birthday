import { motion } from "framer-motion";
import Reveal from "../common/Reveal";
import { scaleIn } from "../../animations/heroVariants";

/**
 * Premium Gallery Card
 * Designed for warm cream backgrounds
 */

export default function GalleryCard({ photo }) {
  const { image, alt } = photo;

  return (
    <Reveal>
      <article
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

          transition-all
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]

          hover:-translate-y-3
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

        <motion.div
          variants={scaleIn()}
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

              transition-all
              duration-700
              ease-[cubic-bezier(0.22,1,0.36,1)]

              group-hover:scale-105
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
      </article>
    </Reveal>
  );
}