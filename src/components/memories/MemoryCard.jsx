import { motion } from "framer-motion";
import Reveal from "../common/Reveal";
import { fadeUp, scaleIn } from "../../animations/heroVariants";

/**
 * MemoryCard
 *
 * Premium Apple × Stripe inspired card
 * Logic unchanged — only UI upgraded.
 */

export default function MemoryCard({ memory, reverse = false }) {
  if (!memory) return null;

  const { image, alt, title, description, year } = memory;

  return (
    <Reveal>
      <article
        className="
          group
          relative

          grid
          grid-cols-1
          items-center
          gap-8

          overflow-hidden

          rounded-[32px]

          border
          border-[#E6D8C9]

          bg-white/55
          backdrop-blur-2xl

          p-6
          sm:p-8
          md:grid-cols-2
          md:gap-12
          md:p-10

          shadow-[0_16px_60px_rgba(44,36,32,0.08)]

          transition-all
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]

          hover:-translate-y-2
          hover:border-[#C9A96E]
          hover:shadow-[0_28px_80px_rgba(44,36,32,0.14)]
        "
      >
        {/* Glass Highlight */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0

            rounded-[32px]

            bg-gradient-to-br
            from-white/35
            via-transparent
            to-[#F5EDE3]/20
          "
        />

        {/* Image */}

        <motion.div
          variants={scaleIn()}
          className={`
            relative
            aspect-[4/3]
            overflow-hidden
            rounded-[24px]

            border
            border-[#EFE3D7]

            ${reverse ? "md:order-2" : "md:order-1"}
          `}
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

              group-hover:scale-[1.04]
              group-hover:brightness-105
              group-hover:contrast-[1.04]
              group-hover:saturate-110
            "
          />

          {/* Soft Luxury Overlay */}

          <div
            className="
              absolute
              inset-0

              bg-gradient-to-t
              from-black/10
              via-transparent
              to-white/10

              opacity-0

              transition-opacity
              duration-500

              group-hover:opacity-100
            "
          />
        </motion.div>

        {/* Content */}

        <motion.div
          variants={fadeUp(0.15)}
          className={`flex flex-col gap-5 ${
            reverse ? "md:order-1" : "md:order-2"
          }`}
        >
          {/* Year */}

          {year && (
            <span
              className="
                w-fit

                rounded-full

                border
                border-[#DCC9B4]

                bg-white/60
                backdrop-blur-xl

                px-4
                py-1.5

                text-[11px]
                font-semibold
                uppercase
                tracking-[0.25em]

                text-[#C9A96E]
              "
            >
              {year}
            </span>
          )}

          {/* Divider */}

          <div
            aria-hidden="true"
            className="
              h-px
              w-20

              bg-gradient-to-r
              from-[#C9A96E]
              via-[#E5D2B8]
              to-transparent
            "
          />

          {/* Title */}

          <h3
            className="
              text-3xl
              md:text-4xl

              font-black

              leading-tight
              tracking-[-0.03em]

              text-[#2C2420]
            "
          >
            {title}
          </h3>

          {/* Description */}

          <p
            className="
              max-w-xl

              text-base
              md:text-lg

              leading-8

              font-normal

              text-[#6B5E54]
            "
          >
            {description}
          </p>
        </motion.div>
      </article>
    </Reveal>
  );
}