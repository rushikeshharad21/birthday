import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Preloader
 * ──────────────────────────────────────────────────────────────────────
 * A brief countdown (3 → 2 → 1) shown before the site itself appears.
 *
 * MOBILE-CENTERING FIX: previously this rendered inline in the normal
 * React tree. `position: fixed` is only reliable if NO ancestor has a
 * `transform`, `filter`, `perspective`, `will-change: transform`, or
 * `backdrop-filter` set — any of those creates a new containing block
 * and silently breaks fixed positioning, which is a very common cause
 * of "centered on desktop, off on mobile" bugs in animated layouts.
 * Rendering through a portal into document.body sidesteps this
 * entirely, regardless of what the rest of the app's ancestor tree
 * does.
 *
 * Usage (in App.jsx) — unchanged:
 *
 *   const [ready, setReady] = useState(false);
 *   return (
 *     <>
 *       {!ready && <Preloader onComplete={() => setReady(true)} />}
 *       <div style={{ visibility: ready ? "visible" : "hidden" }}>
 *         <Home />
 *       </div>
 *     </>
 *   );
 */

const COUNT_START = 3;
const SECOND_MS = 1000;
const EXIT_FADE_MS = 700;

// SVG ring geometry
const RING_SIZE = 168;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Preloader({ onComplete }) {
  const [count, setCount] = useState(COUNT_START);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(true);
  const reducedMotion = useReducedMotionFlag();

  useEffect(() => {
    if (count === 0) {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setMounted(false);
        onComplete?.();
      }, reducedMotion ? 0 : EXIT_FADE_MS);
      return () => clearTimeout(exitTimer);
    }

    const tick = setTimeout(
      () => setCount((c) => c - 1),
      reducedMotion ? 250 : SECOND_MS
    );
    return () => clearTimeout(tick);
  }, [count, reducedMotion, onComplete]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null; // SSR guard

  const node = (
    <div
      role="status"
      aria-live="polite"
      aria-label={count > 0 ? `Starting in ${count}` : "Ready"}
      className={`pl-stage${exiting ? " pl-stage--exit" : ""}`}
    >
      <style>{PRELOADER_STYLES}</style>

      <div className="pl-center">
        <span className="pl-eyebrow">Get Ready</span>

        <div className="pl-ring-wrap">
          <svg
            className="pl-ring"
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="pl-ring-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <filter id="pl-ring-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(139,92,246,0.16)"
              strokeWidth={RING_STROKE}
            />
            <circle
              key={count}
              className={reducedMotion ? "" : "pl-ring__sweep"}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="url(#pl-ring-gradient)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={reducedMotion ? 0 : RING_CIRCUMFERENCE}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              filter="url(#pl-ring-glow)"
            />
          </svg>

          <span key={`digit-${count}`} className="pl-digit" aria-hidden="true">
            {count > 0 ? count : ""}
          </span>
        </div>

        <span className="pl-caption">Your moment is almost here</span>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function useReducedMotionFlag() {
  const ref = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  return ref.current;
}

const PRELOADER_STYLES = `
.pl-stage{
  position:fixed;
  inset:0;
  /* inset:0 already anchors to the live viewport, which handles the
     mobile address-bar resize case better than a static height. But
     we back it up with dvh so the box has an explicit size even if
     something upstream overrides top/right/bottom/left. */
  width:100vw;
  height:100dvh;
  z-index:9999;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  box-sizing:border-box;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background:radial-gradient(ellipse at center, #171227 0%, #07050d 100%);
  opacity:1;
  transition:opacity ${EXIT_FADE_MS}ms cubic-bezier(.25,.46,.45,.94);
}
.pl-stage--exit{
  opacity:0;
  pointer-events:none;
}
.pl-stage *{
  box-sizing:border-box;
}

.pl-center{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:1.75rem;
  max-width:100%;
  padding:0 1.25rem;
}

.pl-eyebrow{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-size:clamp(.62rem, 2.6vw, .7rem);
  font-weight:500;
  letter-spacing:.35em;
  text-transform:uppercase;
  color:#a78bfa;
  opacity:.9;
  white-space:nowrap;
}

.pl-ring-wrap{
  position:relative;
  width:clamp(120px, 38vw, ${RING_SIZE}px);
  height:clamp(120px, 38vw, ${RING_SIZE}px);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.pl-ring{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}

.pl-ring__sweep{
  animation:pl-drain 1s linear forwards;
}
@keyframes pl-drain{
  from{ stroke-dashoffset:${RING_CIRCUMFERENCE}; }
  to{ stroke-dashoffset:0; }
}

.pl-digit{
  font-family:Georgia,'Playfair Display',serif;
  font-size:clamp(2.75rem, 10vw, 3.75rem);
  font-weight:500;
  line-height:1;
  background:linear-gradient(135deg, #93c5fd 0%, #a78bfa 50%, #e879f9 100%);
  background-clip:text;
  -webkit-background-clip:text;
  color:transparent;
  -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 18px rgba(168,139,250,0.45));
  animation:pl-digit-in .5s cubic-bezier(.25,.46,.45,.94);
}
@keyframes pl-digit-in{
  from{ opacity:0; transform:scale(0.85); }
  to{ opacity:1; transform:scale(1); }
}

.pl-caption{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-size:clamp(.72rem, 3vw, .8rem);
  font-weight:300;
  letter-spacing:.04em;
  color:#a99bc9;
  text-align:center;
}

@media (prefers-reduced-motion: reduce){
  .pl-ring__sweep{ animation:none; }
  .pl-digit{ animation:none; }
  .pl-stage{ transition:none; }
}
`;