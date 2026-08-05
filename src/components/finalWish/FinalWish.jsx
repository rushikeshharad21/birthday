import React from "react";

/**
 * FinalWish
 * ──────────────────────────────────────────────────────────────────────
 * The closing section of the birthday experience. Warm, quiet, and still —
 * the moment the visitor stops scrolling. Continues the established
 * cream / glass / gold luxury language. Fully static — no motion library,
 * no keyframe animation, no scroll-triggered reveals.
 *
 * ENHANCEMENT NOTES (read before changing further):
 * - Every visual upgrade here is a CSS gradient/shadow layer, not motion.
 *   That's intentional, not a limitation — the rest of the experience
 *   (preloader countdown, sparkle burst) is loud and kinetic; this
 *   section being still is what makes it read as an ending. Don't add
 *   @keyframes here without deciding that tradeoff on purpose.
 * - Signature font stack ("Parisienne" primary) assumes you add:
 *     <link rel="preconnect" href="https://fonts.googleapis.com">
 *     <link href="https://fonts.googleapis.com/css2?family=Parisienne&display=swap" rel="stylesheet">
 *   to index.html <head> — NOT an @import in this file's <style> tag,
 *   which would reload the font stylesheet on every mount of this
 *   section instead of once, cached, at document load.
 * - Perf budget stayed the same as the original: 3 blurred ambient
 *   divs (was 2), one backdrop-blur (the CTA, unchanged), zero new
 *   JS-driven paints. All gradient layering happens via comma-separated
 *   `background` values on existing elements, not new DOM nodes stacked
 *   on top of each other.
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
      {/* Ambient warm lighting — pure CSS, static, no motion.
          Three layered blobs instead of two: a top wash, a bottom-right
          pool, and a faint bottom-left rose-gold layer for depth. Each
          uses a multi-stop gradient rather than a flat two-color fade,
          which is what makes it read as "light" instead of "a blurred
          circle" up close. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="finalwish__glow finalwish__glow--top" />
        <div className="finalwish__glow finalwish__glow--bottom" />
        <div className="finalwish__glow finalwish__glow--accent" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Eyebrow */}
        <span className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#B8935A]">
          With Love
        </span>

        {/* Heading — deliberately solid color, not gradient. Gradient
            text on a cream background is a common contrast failure;
            this stays legible and puts the gradient budget where it
            doesn't risk accessibility: the orb, glow, and ornament. */}
        <h2 style={{color:"violet"}} className="font-serif font-bold text-[3.95rem] tracking-tight leading-[1.1]  font-red-200 sm:text-6xl">
          Happy Birthday
          <span className="mt-2 block text-2xl font-light italic tracking-normal text-[#2B2620]/80 sm:text-3xl">
            My Dear Sister
          </span>
        </h2>

        {/* Divider — now a two-band gradient with a small rotated
            diamond ornament at center, instead of a single flat line */}
        <div className="finalwish__divider my-10" aria-hidden="true">
          <span className="finalwish__divider-line" />
          <span className="finalwish__divider-diamond" />
          <span className="finalwish__divider-line" />
        </div>

        {/* Message */}
        <p className="max-w-lg text-balance text-lg font-light leading-relaxed text-[#6B6154] sm:text-xl">
          Some people fill a room with laughter. You filled a childhood with it.
          Across every year that's carried us to this one, you have been the
          steady, generous heart of our family — and the truest kind of friend.
          Today isn't just about the years behind you. It's a quiet thank you
          for exactly who you are, and a wish for everything still ahead.
        </p>

        {/* Signature — subtle gradient fill. Solid color declared first
            as a fallback for browsers without background-clip:text. */}
        <p className="finalwish__signature mt-10 text-3xl sm:text-4xl">
          — Your Loving Brother
        </p>

        {/* Centerpiece: a single still glass orb, now built from three
            layered gradients (specular highlight + warm depth shadow +
            base sphere) instead of one flat radial, plus a doubled ring
            for a more refined glass edge. Still one element, one paint. */}
        <div
          className="finalwish__orb-wrap relative my-16 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48"
          role="img"
          aria-label="A softly glowing golden orb, a quiet symbol of warmth"
        >
          <div className="finalwish__orb-ring finalwish__orb-ring--outer" aria-hidden="true" />
          <div className="finalwish__orb-ring finalwish__orb-ring--inner" aria-hidden="true" />
          <div className="finalwish__orb" aria-hidden="true" />
        </div>

        {/* CTA — gradient border via layered background-clip trick
            (background-origin/background-clip on two stacked
            background-images), rather than box-shadow stacking, which
            keeps it to a single composited layer. */}
        <button
          type="button"
          onClick={handleReplay}
          className="finalwish__cta relative inline-flex items-center justify-center px-9 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[#2B2620] backdrop-blur-sm transition-colors duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A24B]"
        >
          Replay Journey
        </button>
      </div>

      {/* Scoped presentational styles: static gradients, orb, signature
          font. No @keyframes, no transitions beyond the button hover
          state (color-only, same as the original). */}
      <style>{`
        .finalwish__glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
        }
        .finalwish__glow--top {
          top: -10%;
          left: 50%;
          width: 36rem;
          height: 36rem;
          opacity: 0.35;
          transform: translateX(-50%);
          background: radial-gradient(circle, #FDF6E8 0%, #F3E3C4 45%, transparent 75%);
        }
        .finalwish__glow--bottom {
          bottom: -15%;
          right: -10%;
          width: 30rem;
          height: 30rem;
          opacity: 0.35;
          background: radial-gradient(circle, #F0DDB8 0%, #EADCC0 45%, transparent 75%);
        }
        .finalwish__glow--accent {
          bottom: 5%;
          left: -8%;
          width: 22rem;
          height: 22rem;
          opacity: 0.2;
          background: radial-gradient(circle, #E8C9C0 0%, #EADCC0 50%, transparent 75%);
        }

        .finalwish__divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
        }
        .finalwish__divider-line {
          height: 1px;
          width: 4.5rem;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #C9A24B 55%,
            #E8C97E 80%,
            transparent 100%
          );
        }
        .finalwish__divider-line:first-child {
          background: linear-gradient(
            270deg,
            transparent 0%,
            #C9A24B 55%,
            #E8C97E 80%,
            transparent 100%
          );
        }
        .finalwish__divider-diamond {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          transform: rotate(45deg);
          background: linear-gradient(135deg, #F3E3C4 0%, #C9A24B 100%);
        }

        .finalwish__signature {
          font-family: "Parisienne", "Segoe Script", "Snell Roundhand",
            "Brush Script MT", cursive;
          font-weight: 400;
          /* fallback first, gradient second — if background-clip:text
             isn't supported, this renders as solid gold instead of
             invisible/transparent text */
          color: #B8935A;
          background: linear-gradient(100deg, #C9A24B 0%, #E8C97E 40%, #B8935A 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .finalwish__orb {
          position: absolute;
          inset: 30%;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 30% 24%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 26%),
            radial-gradient(circle at 68% 72%, rgba(150,110,40,0.35) 0%, rgba(150,110,40,0) 45%),
            radial-gradient(circle at 35% 30%, #FDF6E8 0%, #E8C97E 45%, #C9A24B 100%);
          box-shadow:
            0 0 40px 6px rgba(201, 162, 75, 0.35),
            inset 0 -10px 18px rgba(120, 90, 30, 0.22),
            inset 0 6px 10px rgba(255, 255, 255, 0.35);
        }
        .finalwish__orb-ring {
          position: absolute;
          border-radius: 9999px;
        }
        .finalwish__orb-ring--outer {
          inset: 0;
          border: 1px solid rgba(201, 162, 75, 0.28);
        }
        .finalwish__orb-ring--inner {
          inset: 14%;
          border: 1px solid rgba(201, 162, 75, 0.14);
        }

        .finalwish__cta {
          border-radius: 9999px;
          border: 1px solid transparent;
          background-image:
            linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)),
            linear-gradient(120deg, #C9A24B 0%, #E8C97E 50%, #C9A24B 100%);
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
        .finalwish__cta:hover {
          background-image:
            linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)),
            linear-gradient(120deg, #C9A24B 0%, #E8C97E 50%, #C9A24B 100%);
        }
      `}</style>
    </section>
  );
}