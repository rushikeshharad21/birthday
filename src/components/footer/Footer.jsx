import MusicToggleButton from "../music/MusicToggleButton";

export default function Footer() {
  return (
    <footer
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden

        bg-gradient-to-b
        from-[#F8F4EE]
        via-[#F4EDE2]
        to-[#EADCC8]

        text-[#2C2420]
      "
    >
      {/* Ambient Gold Glow */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0

          bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_60%)]
        "
      />

      {/* Soft Bottom Glow */}
      <div
        aria-hidden="true"
        className="
          absolute
          bottom-0
          left-1/2
          h-[450px]
          w-[700px]
          -translate-x-1/2

          rounded-full

          bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_70%)]

          blur-3xl
        "
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Heading */}
        <h3
          className="
            text-5xl
            md:text-6xl
            lg:text-7xl

            font-black

            leading-none
            tracking-[-0.05em]

            text-red-300

            drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)]
          "
        >
          Thank You 
        </h3>

        {/* Decorative Divider */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

          <div className="h-2 w-2 rounded-full bg-[#C9A96E]" />

          <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
        </div>

        {/* Subtitle */}
        <p
          className="
            mx-auto
            mt-8
            max-w-xl

            text-lg
            leading-8

            text-[#6B5E54]
          "
        >
          Wishing you endless happiness, beautiful memories,
          <br />
          and a life filled with love, laughter, and dreams that always come true.
        </p>

        {/* Music Button */}
        <div className="mt-12 flex justify-center">
          <MusicToggleButton />
        </div>
      </div>
    </footer>
  );
}