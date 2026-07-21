import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/heroVariants";

/**
 * HeroTitle
 *
 * Premium cinematic hero title.
 * Architecture unchanged.
 */

export default function HeroTitle() {
  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={staggerContainer()}
      className="flex flex-col items-center text-center"
    >
      {/* Eyebrow */}

      <motion.div variants={fadeUp(0)}>
        <span
          className="
            inline-flex
            items-center
            gap-4

            rounded-full

            border
            border-white/10

            bg-white/[0.04]
            backdrop-blur-xl

            px-6
            py-2.5

            text-[11px]
            font-semibold
            uppercase
            tracking-[0.35em]

            text-[#D4AF37]

            shadow-[0_8px_30px_rgba(0,0,0,0.25)]
          "
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]/70" />

          For Someone Very Special

          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D4AF37]/70" />
        </span>
      </motion.div>

      {/* Heading */}

      <motion.h1
        variants={fadeUp(0.15)}
        className="
          mt-10

          flex
          flex-col
          items-center

          gap-3
        "
      >
        {/* Happy Birthday */}

        <span
          className="
            text-5xl
            sm:text-6xl
            md:text-7xl
            lg:text-[6rem]

            font-black

            leading-[0.92]
            tracking-[-0.06em]

            bg-gradient-to-b
            from-white
            via-[#FFF6E5]
            to-[#F5D38A]

            bg-clip-text
            text-transparent

            drop-shadow-[0_8px_30px_rgba(255,230,180,0.12)]
          "
        >
          Happy Birthday
        </span>

        {/* My Dear Sister */}

        <span
          className="
            text-4xl
            sm:text-5xl
            md:text-6xl
            lg:text-7xl

            font-black

            leading-none
            tracking-[-0.05em]

            bg-gradient-to-r
            from-[#FFD7E5]
            via-[#FFB7CC]
            to-[#FF8FA8]

            bg-clip-text
            text-transparent

            drop-shadow-[0_8px_30px_rgba(255,120,170,0.12)]
          "
        >
          My Dear Sister
        </span>
      </motion.h1>

      {/* Divider */}

      <motion.div
        variants={fadeUp(0.3)}
        className="relative mt-10 flex items-center justify-center"
      >
        {/* Glow */}

        <div
          className="
            absolute

            h-4
            w-56

            rounded-full

            bg-[#D4AF37]/20

            blur-2xl
          "
        />

        {/* Line */}

        <div
          className="
            relative

            h-px
            w-56

            bg-gradient-to-r
            from-transparent
            via-[#D4AF37]
            to-transparent
          "
        />

        {/* Center Dot */}

        <div
          className="
            absolute

            h-2
            w-2

            rounded-full

            bg-[#F5D38A]

            shadow-[0_0_20px_rgba(212,175,55,0.9)]
          "
        />
      </motion.div>
    </motion.header>
  );
}