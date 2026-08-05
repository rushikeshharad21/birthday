import React, { useEffect, useState, useMemo } from "react";

/**
 * WelcomeBurst
 * ──────────────────────────────────────────────────────────────────────
 * A one-shot celebration overlay: sparkles (on by default) and balloons
 * (off by default — see note below on why). Mounts once, plays, then
 * removes itself so it never sits on top of interactive content.
 *
 * Usage (in App.jsx):
 *
 *   const [ready, setReady] = useState(false);
 *   return (
 *     <>
 *       {!ready && <Preloader onComplete={() => setReady(true)} />}
 *       {ready && <WelcomeBurst />}
 *       <div style={{ visibility: ready ? "visible" : "hidden" }}>
 *         <Home />
 *       </div>
 *     </>
 *   );
 *
 * Props:
 *   showSparkles  (bool, default true)  — twinkling particles, falls with the palette
 *   showBalloons  (bool, default false) — floating balloons; turn on only if the
 *                                          site's tone is actually celebratory.
 *                                          Birthday/event sites: yes. Portfolio,
 *                                          agency, product launch with the dark
 *                                          cinematic look this preloader has: no,
 *                                          it'll fight the aesthetic.
 *   duration      (ms, default 2600)   — how long the burst plays before unmounting
 */

const SPARKLE_COUNT_DESKTOP = 26;
const SPARKLE_COUNT_MOBILE = 14;
const BALLOON_COUNT_DESKTOP = 7;
const BALLOON_COUNT_MOBILE = 4;

const BALLOON_COLORS = [
  ["#60a5fa", "#3b82f6"],
  ["#a78bfa", "#8b5cf6"],
  ["#e879f9", "#d946ef"],
  ["#93c5fd", "#60a5fa"],
];

export default function WelcomeBurst({
  showSparkles = true,
  showBalloons = false,
  duration = 2600,
}) {
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration - 500);
    const removeTimer = setTimeout(() => setMounted(false), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  const sparkles = useMemo(
    () => buildSparkles(isMobile ? SPARKLE_COUNT_MOBILE : SPARKLE_COUNT_DESKTOP),
    [isMobile]
  );
  const balloons = useMemo(
    () => buildBalloons(isMobile ? BALLOON_COUNT_MOBILE : BALLOON_COUNT_DESKTOP),
    [isMobile]
  );

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`wb-stage${exiting ? " wb-stage--exit" : ""}`}
    >
      <style>{WELCOME_BURST_STYLES}</style>

      {showSparkles &&
        sparkles.map((s) => (
          <span
            key={s.id}
            className={`wb-sparkle wb-sparkle--${s.type}`}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              "--sparkle-color": s.color,
              "--sparkle-rotate": `${s.rotate}deg`,
              "--sparkle-drift-x": `${s.driftX}px`,
              "--sparkle-drift-y": `${s.driftY}px`,
            }}
          />
        ))}

      {showBalloons &&
        balloons.map((b) => (
          <span
            key={b.id}
            className="wb-balloon"
            style={{
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              "--balloon-top": b.gradient[0],
              "--balloon-bottom": b.gradient[1],
            }}
          >
            <span className="wb-balloon__string" />
          </span>
        ))}
    </div>
  );
}

// Pulled from the preloader's own ring gradient so the burst reads as
// part of the same visual system instead of a bolted-on effect.
const SPARKLE_COLORS = ["#93c5fd", "#a78bfa", "#e879f9", "#ffffff"];

function buildSparkles(count) {
  return Array.from({ length: count }, (_, i) => {
    // ~35% "flare" (bigger, star-shaped, bright) for focal points,
    // ~65% "dust" (small, soft, blurred) for ambient depth behind them.
    const isFlare = Math.random() < 0.35;
    return {
      id: i,
      type: isFlare ? "flare" : "dust",
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: isFlare ? 10 + Math.random() * 8 : 2.5 + Math.random() * 3,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
      rotate: Math.random() * 360,
      // small random drift so each sparkle moves as it twinkles
      // instead of scaling in place
      driftX: (Math.random() - 0.5) * 40,
      driftY: (Math.random() - 0.5) * 40 - 10, // slight upward bias
      delay: Math.random() * 1.4,
      dur: isFlare ? 1.3 + Math.random() * 1.1 : 1.6 + Math.random() * 1.6,
    };
  });
}

function buildBalloons(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 6 + Math.random() * 88,
    delay: Math.random() * 0.5,
    dur: 3.2 + Math.random() * 1.6,
    gradient: BALLOON_COLORS[i % BALLOON_COLORS.length],
  }));
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

const WELCOME_BURST_STYLES = `
.wb-stage{
  position:fixed;
  inset:0;
  width:100vw;
  height:100dvh;
  z-index:9998;
  pointer-events:none;
  overflow:hidden;
  opacity:1;
  transition:opacity .5s ease;
}
.wb-stage--exit{
  opacity:0;
}

.wb-sparkle{
  position:absolute;
  opacity:0;
  animation-name:wb-twinkle;
  animation-timing-function:ease-in-out;
  animation-fill-mode:forwards;
  will-change:transform, opacity;
}

/* Flares: bright, star-shaped focal points. The 8-point star clip-path
   is what actually reads as "sparkle" rather than "glowing dot". */
.wb-sparkle--flare{
  background:radial-gradient(circle, #fff 0%, var(--sparkle-color) 55%, transparent 78%);
  filter:drop-shadow(0 0 5px var(--sparkle-color)) drop-shadow(0 0 10px var(--sparkle-color));
  clip-path:polygon(
    50% 0%, 62% 38%, 100% 50%,
    62% 62%, 50% 100%, 38% 62%,
    0% 50%, 38% 38%
  );
}

/* Dust: small, soft, blurred — ambient depth layer sitting behind the
   flares so the burst has foreground/background instead of one flat
   plane of identical particles. */
.wb-sparkle--dust{
  border-radius:50%;
  background:var(--sparkle-color);
  filter:blur(0.4px);
  opacity:0;
}

@keyframes wb-twinkle{
  0%{
    opacity:0;
    transform:translate(0, 0) scale(0.2) rotate(var(--sparkle-rotate));
  }
  35%{
    opacity:1;
    transform:translate(calc(var(--sparkle-drift-x) * 0.4), calc(var(--sparkle-drift-y) * 0.4))
      scale(1) rotate(calc(var(--sparkle-rotate) + 60deg));
  }
  70%{
    opacity:0.85;
  }
  100%{
    opacity:0;
    transform:translate(var(--sparkle-drift-x), var(--sparkle-drift-y))
      scale(0.3) rotate(calc(var(--sparkle-rotate) + 140deg));
  }
}

.wb-balloon{
  position:absolute;
  bottom:-140px;
  width:46px;
  height:58px;
  border-radius:50% 50% 50% 50% / 58% 58% 42% 42%;
  background:linear-gradient(160deg, var(--balloon-top) 0%, var(--balloon-bottom) 100%);
  box-shadow:inset -6px -8px 14px rgba(0,0,0,0.18), inset 6px 6px 10px rgba(255,255,255,0.25);
  opacity:0;
  animation-name:wb-float;
  animation-timing-function:cubic-bezier(.33,.1,.4,1);
  animation-fill-mode:forwards;
}
.wb-balloon::before{
  content:"";
  position:absolute;
  left:50%;
  bottom:-8px;
  width:0;
  height:0;
  transform:translateX(-50%);
  border-left:5px solid transparent;
  border-right:5px solid transparent;
  border-top:8px solid var(--balloon-bottom);
}
.wb-balloon__string{
  position:absolute;
  left:50%;
  top:100%;
  width:1px;
  height:70px;
  background:rgba(255,255,255,0.35);
  transform:translateX(-50%);
}
@keyframes wb-float{
  0%{ opacity:0; transform:translateY(0) translateX(0) rotate(-4deg); }
  8%{ opacity:0.95; }
  50%{ transform:translateY(-52vh) translateX(14px) rotate(4deg); }
  100%{ opacity:0; transform:translateY(-108vh) translateX(-10px) rotate(-3deg); }
}

@media (prefers-reduced-motion: reduce){
  .wb-sparkle, .wb-sparkle--flare, .wb-sparkle--dust, .wb-balloon{
    animation:none;
    opacity:0;
  }
  .wb-stage{ transition:none; }
}
`;