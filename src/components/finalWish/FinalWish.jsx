import React from "react";

/**
 * FinalWish
 * ──────────────────────────────────────────────────────────────────────
 * The closing section of the birthday experience. Warm, quiet, and still —
 * the moment the visitor stops scrolling. Continues the established
 * cream / glass / gold luxury language. Fully static — no motion library,
 * no keyframe animation, no scroll-triggered reveals.
 */
export default function FinalWish({ onReplay }) {
  const handleReplay = () => {
    if (typeof onReplay === "function") {
      onReplay();
      return;
    }
    // Sensible default: jump back to the top of the experience.
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <section
      aria-label="A closing birthday message"
      className="finalwish relative isolate overflow-hidden bg-[#FBF6EE] px-6 py-32 sm:py-40 lg:py-48"
    >
      {/* Ambient warm lighting — pure CSS, static, no motion */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="finalwish__glow finalwish__glow--top" />
        <div className="finalwish__glow finalwish__glow--bottom" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Eyebrow */}
        <span className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#B8935A]">
          With Love
        </span>

        {/* Heading */}
        <h2 className="font-serif text-[2.75rem] leading-[1.1] tracking-tight text-[#2B2620] sm:text-6xl">
          Happy Birthday
          <span className="mt-2 block text-2xl font-light italic tracking-normal text-[#2B2620]/80 sm:text-3xl">
            My Dear Sister
          </span>
        </h2>

        {/* Divider */}
        <div
          className="my-10 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent"
          aria-hidden="true"
        />

        {/* Message */}
        <p className="max-w-lg text-balance text-lg font-light leading-relaxed text-[#6B6154] sm:text-xl">
          Some people fill a room with laughter. You filled a childhood with it.
          Across every year that's carried us to this one, you have been the
          steady, generous heart of our family — and the truest kind of friend.
          Today isn't just about the years behind you. It's a quiet thank you
          for exactly who you are, and a wish for everything still ahead.
        </p>

        {/* Signature */}
        <p className="finalwish__signature mt-10 text-3xl text-[#B8935A] sm:text-4xl">
          — Your Loving Brother
        </p>

        {/* Centerpiece: a single still glass orb */}
        <div
          className="finalwish__orb-wrap relative my-16 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48"
          role="img"
          aria-label="A softly glowing golden orb, a quiet symbol of warmth"
        >
          <div className="finalwish__orb-ring" aria-hidden="true" />
          <div className="finalwish__orb" aria-hidden="true" />
        </div>

        {/* CTA — reuses the hero button styling */}
        <button
          type="button"
          onClick={handleReplay}
          className="finalwish__cta relative inline-flex items-center justify-center rounded-full border border-[#C9A24B]/40 bg-white/40 px-9 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[#2B2620] backdrop-blur-sm transition-colors duration-500 ease-out hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A24B]"
        >
          Replay Journey
        </button>
      </div>

      {/* Scoped presentational styles: static glow, orb, signature font.
          No @keyframes, no transitions beyond the button hover state. */}
      <style>{`
        .finalwish__glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.35;
        }
        .finalwish__glow--top {
          top: -10%;
          left: 50%;
          width: 36rem;
          height: 36rem;
          transform: translateX(-50%);
          background: radial-gradient(circle, #F3E3C4 0%, transparent 70%);
        }
        .finalwish__glow--bottom {
          bottom: -15%;
          right: -10%;
          width: 30rem;
          height: 30rem;
          background: radial-gradient(circle, #EADCC0 0%, transparent 70%);
        }

        .finalwish__signature {
          font-family: "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive;
          font-weight: 400;
        }

        .finalwish__orb {
          position: absolute;
          inset: 30%;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, #FDF6E8 0%, #E8C97E 45%, #C9A24B 100%);
          box-shadow: 0 0 40px 6px rgba(201, 162, 75, 0.35);
        }
        .finalwish__orb-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 1px solid rgba(201, 162, 75, 0.3);
        }
      `}</style>
    </section>
  );
}