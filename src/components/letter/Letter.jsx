
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
/* ═══════════════════════════════════════════════════════════════════════
   STYLES — all classes prefixed `bc-` to avoid collisions
   ═══════════════════════════════════════════════════════════════════════ */
const STYLES = `
/* ── Scene ────────────────────────────────────────────────────── */
.bc-scene{
  --bc-cream:#faf6f0;--bc-champagne:#f5ede3;--bc-pearl:#f0e8de;
  --bc-rose:#d4a0a0;--bc-rose-lt:#e8c4c4;
  --bc-lavender:#b8a9c9;--bc-lavender-lt:#d4c9e0;
  --bc-gold:#c9a96e;--bc-gold-lt:#e0d0a8;
  --bc-txt:#2c2420;--bc-txt-m:#6b5e54;--bc-txt-l:#9b8e84;
  position:relative;width:100%;min-height:100vh;
  display:flex;align-items:center;justify-content:center;
  padding:2rem;overflow:hidden;
  background:var(--bc-cream);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
}
/* noise grain */
.bc-scene::after{
  content:'';position:absolute;inset:0;opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:256px 256px;pointer-events:none;z-index:0;
}
/* soft vignette */
.bc-scene::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.035) 100%);
  pointer-events:none;z-index:0;
}
/* ── Background orbs ─────────────────────────────────────────── */
.bc-orb{position:absolute;border-radius:50%;pointer-events:none;will-change:transform}
.bc-orb--rose{
  width:min(820px,95vw);height:min(820px,95vw);
  background:radial-gradient(circle,rgba(212,160,160,.18) 0%,transparent 70%);
  top:-22%;right:-18%;animation:bc-drift 26s ease-in-out infinite;
}
.bc-orb--lav{
  width:min(680px,85vw);height:min(680px,85vw);
  background:radial-gradient(circle,rgba(184,169,201,.14) 0%,transparent 70%);
  bottom:-18%;left:-12%;animation:bc-drift 32s ease-in-out infinite reverse;
}
.bc-orb--gold{
  width:min(520px,72vw);height:min(520px,72vw);
  background:radial-gradient(circle,rgba(201,169,110,.10) 0%,transparent 70%);
  top:42%;left:32%;transform:translate(-50%,-50%);
  animation:bc-drift 22s ease-in-out infinite 4s;
}
/* ── Particles ───────────────────────────────────────────────── */
.bc-particle{
  position:absolute;border-radius:50%;background:var(--bc-gold);
  pointer-events:none;will-change:transform,opacity;
}
.bc-sparkle{
  position:absolute;color:var(--bc-gold);font-size:11px;
  pointer-events:none;will-change:transform,opacity;
  animation:bc-pulse var(--dur,4s) ease-in-out var(--del,0s) infinite;
}
/* ── Card ────────────────────────────────────────────────────── */
.bc-wrap{
  position:relative;z-index:1;perspective:1200px;
  width:100%;max-width:520px;
}
.bc-card{
  position:relative;
  padding:3.5rem 3rem;
  background:rgba(255,252,248,.72);
  backdrop-filter:blur(40px) saturate(1.2);
  -webkit-backdrop-filter:blur(40px) saturate(1.2);
  border-radius:24px;
  border:1px solid rgba(255,255,255,.55);
  box-shadow:
    0 4px 24px rgba(212,160,160,.08),
    0 12px 48px rgba(184,169,201,.06),
    0 24px 80px rgba(0,0,0,.04),
    inset 0 1px 0 rgba(255,255,255,.8);
  transform-style:preserve-3d;will-change:transform;
  overflow:hidden;
  transition:box-shadow .5s cubic-bezier(.25,.46,.45,.94);
}
.bc-card:hover{
  box-shadow:
    0 8px 32px rgba(212,160,160,.13),
    0 20px 60px rgba(184,169,201,.09),
    0 32px 96px rgba(0,0,0,.06),
    inset 0 1px 0 rgba(255,255,255,.85);
}
/* animated gradient border */
.bc-card::before{
  content:'';position:absolute;inset:-1px;border-radius:25px;padding:1px;
  background:linear-gradient(135deg,
    rgba(212,160,160,.32),rgba(201,169,110,.18),
    rgba(184,169,201,.30),rgba(201,169,110,.18),
    rgba(212,160,160,.32));
  background-size:300% 300%;animation:bc-border 8s ease infinite;
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  pointer-events:none;z-index:2;
}
/* specular highlight */
.bc-spec{
  position:absolute;width:360px;height:360px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.13) 0%,transparent 60%);
  pointer-events:none;z-index:1;transition:opacity .4s;will-change:transform;
}
/* ── Content ─────────────────────────────────────────────────── */
.bc-content{position:relative;z-index:3;text-align:center}
.bc-date{
  font-family:'Inter',sans-serif;font-size:.7rem;font-weight:500;
  letter-spacing:.28em;text-transform:uppercase;
  color:var(--bc-gold);margin-bottom:1.75rem;
}
.bc-title{
  font-family:'Playfair Display',Georgia,serif;
  font-size:clamp(2.4rem,7vw,3.8rem);font-weight:600;
  line-height:1.12;letter-spacing:-.02em;
  background:linear-gradient(135deg,var(--bc-txt) 0%,#8b6f5e 55%,var(--bc-gold) 100%);
  background-size:200% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
  animation:bc-shimmer 6s ease-in-out infinite;
  margin-bottom:.65rem;
}
.bc-sub{
  font-family:'Inter',sans-serif;
  font-size:clamp(.88rem,2.5vw,1.05rem);font-weight:300;
  color:var(--bc-txt-m);letter-spacing:.05em;margin-bottom:2.25rem;
}
/* divider */
.bc-div{
  display:flex;align-items:center;justify-content:center;
  gap:1rem;margin:0 auto 2rem;max-width:200px;
}
.bc-div-line{
  flex:1;height:1px;
  background:linear-gradient(90deg,transparent,var(--bc-gold-lt),transparent);
}
.bc-div-dot{
  color:var(--bc-gold);font-size:.6rem;opacity:.65;
  animation:bc-pulse 4s ease-in-out infinite;
}
/* message */
.bc-msg{
  font-family:'Inter',sans-serif;
  font-size:clamp(.85rem,2vw,.9375rem);font-weight:300;
  line-height:1.9;color:var(--bc-txt-m);
  max-width:380px;margin:0 auto 2rem;letter-spacing:.012em;
}
/* signature */
.bc-sig{
  font-family:'Playfair Display',serif;font-style:italic;
  font-size:1rem;color:var(--bc-txt-l);margin-bottom:2.5rem;
}
/* ── CTA Button ──────────────────────────────────────────────── */
.bc-cta{
  position:relative;display:inline-flex;align-items:center;gap:.55rem;
  padding:.9rem 2.2rem;
  font-family:'Inter',sans-serif;font-size:.8rem;font-weight:400;
  letter-spacing:.12em;text-transform:uppercase;
  color:var(--bc-txt);background:rgba(255,252,248,.55);
  border:1px solid rgba(201,169,110,.22);border-radius:100px;
  cursor:pointer;overflow:hidden;outline:none;
  transition:all .4s cubic-bezier(.25,.46,.45,.94);
}
.bc-cta:hover{
  background:rgba(201,169,110,.12);
  border-color:rgba(201,169,110,.4);
  box-shadow:0 4px 20px rgba(201,169,110,.14),0 8px 36px rgba(201,169,110,.08);
  transform:translateY(-2px);
}
.bc-cta:focus-visible{outline:2px solid var(--bc-gold);outline-offset:4px}
.bc-cta:active{transform:translateY(0)}
.bc-cta::after{
  content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  pointer-events:none;
}
.bc-cta:hover::after{left:100%;transition:left .65s ease}
.bc-cta-s{font-size:.55rem;opacity:.55}
/* ── Burst container ─────────────────────────────────────────── */
.bc-burst{position:absolute;top:50%;left:50%;pointer-events:none;z-index:10}
/* ── Keyframes ───────────────────────────────────────────────── */
@keyframes bc-drift{
  0%,100%{transform:translate(0,0) scale(1)}
  25%{transform:translate(18px,-22px) scale(1.02)}
  50%{transform:translate(-12px,18px) scale(.98)}
  75%{transform:translate(22px,12px) scale(1.01)}
}
@keyframes bc-float{
  0%{transform:translateY(0) translateX(0) scale(1);opacity:0}
  8%{opacity:var(--mo,.3)}
  88%{opacity:var(--mo,.3)}
  100%{transform:translateY(calc(-100vh - 60px)) translateX(var(--dx,20px)) scale(.45);opacity:0}
}
@keyframes bc-pulse{
  0%,100%{opacity:.18;transform:scale(.8) rotate(0deg)}
  50%{opacity:.85;transform:scale(1.15) rotate(180deg)}
}
@keyframes bc-border{
  0%,100%{background-position:0% 50%}
  50%{background-position:100% 50%}
}
@keyframes bc-shimmer{
  0%,100%{background-position:0% center}
  50%{background-position:100% center}
}
/* ── Responsive ──────────────────────────────────────────────── */
@media(max-width:640px){
  .bc-scene{padding:1.5rem 1rem}
  .bc-card{padding:2.5rem 1.75rem;border-radius:20px}
  .bc-date{font-size:.65rem;margin-bottom:1.25rem}
  .bc-sub{margin-bottom:1.75rem}
  .bc-msg{line-height:1.8;margin-bottom:1.5rem}
  .bc-sig{margin-bottom:2rem}
}
@media(max-width:380px){
  .bc-card{padding:2rem 1.25rem;border-radius:16px}
  .bc-cta{padding:.75rem 1.6rem;font-size:.72rem}
}
@media(min-width:1200px){
  .bc-wrap{max-width:560px}
  .bc-card{padding:4rem 3.5rem}
}
/* ── Reduced motion ──────────────────────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .bc-orb,.bc-particle,.bc-sparkle,.bc-card::before,.bc-title{animation:none!important}
  .bc-spec{display:none}
  .bc-cta::after{display:none}
}
`;
/* ═══════════════════════════════════════════════════════════════════════
   ANIMATION CONFIG
   ═══════════════════════════════════════════════════════════════════════ */
const EASE = [0.25, 0.46, 0.45, 0.94];
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.13, delayChildren: 0.35 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};
const revealItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE },
  },
};
const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};
/* ═══════════════════════════════════════════════════════════════════════
   DATA GENERATORS (called once, memoised)
   ═══════════════════════════════════════════════════════════════════════ */
const makeParticles = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.8 + 1,
    dur: Math.random() * 26 + 18,
    del: Math.random() * 16,
    mo: Math.random() * 0.28 + 0.08,
    dx: (Math.random() - 0.5) * 55,
  }));
const makeSparkles = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    left: `${14 + Math.random() * 72}%`,
    top: `${8 + Math.random() * 82}%`,
    dur: 3 + Math.random() * 4.5,
    del: Math.random() * 6,
  }));
const makeBurst = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    angle: (i / n) * Math.PI * 2,
    dist: 48 + Math.random() * 75,
    size: 2.5 + Math.random() * 3.5,
    color: ["#c9a96e", "#d4a0a0", "#b8a9c9", "#e0d0a8", "#e8c4c4"][i % 5],
    del: Math.random() * 0.14,
  }));
/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const BirthdayCard = () => {
  /* ── state ──────────────────────────────────────────────────── */
  const [isRevealed, setIsRevealed] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const cardRef = useRef(null);
  /* ── motion values (tilt + specular) ────────────────────────── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useMotionValue(-180);
  const sy = useMotionValue(-180);
  const rotX = useTransform(my, [-0.5, 0.5], [3, -3]);
  const rotY = useTransform(mx, [-0.5, 0.5], [-3, 3]);
  const sRotX = useSpring(rotX, { stiffness: 150, damping: 22 });
  const sRotY = useSpring(rotY, { stiffness: 150, damping: 22 });
  const sSX = useSpring(sx, { stiffness: 90, damping: 28 });
  const sSY = useSpring(sy, { stiffness: 90, damping: 28 });
  /* ── memoised data ──────────────────────────────────────────── */
  const particles = useMemo(() => makeParticles(28), []);
  const sparkles = useMemo(() => makeSparkles(7), []);
  const burstParts = useMemo(() => makeBurst(22), []);
  /* ── load Google Fonts ──────────────────────────────────────── */
  useEffect(() => {
    const href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href,
      });
      document.head.appendChild(link);
    }
  }, []);
  /* ── reduced-motion listener ────────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  /* ── mouse handlers ─────────────────────────────────────────── */
  const onMove = useCallback(
    (e) => {
      if (reducedMotion) return;
      const r = cardRef.current?.getBoundingClientRect();
      if (!r) return;
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
      sx.set(e.clientX - r.left - 180);
      sy.set(e.clientY - r.top - 180);
    },
    [mx, my, sx, sy, reducedMotion]
  );
  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);
  /* ── reveal / celebrate ─────────────────────────────────────── */
  const reveal = useCallback(() => {
    setIsRevealed(true);
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 900);
  }, []);
  const celebrate = useCallback(() => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 900);
  }, []);
  /* ── render ─────────────────────────────────────────────────── */
  return (
    <section className="bc-scene" role="main" aria-label="Birthday greeting card">
      <style>{STYLES}</style>
      {/* ── background orbs ──────────────────────────────────── */}
      <div className="bc-orb bc-orb--rose" aria-hidden="true" />
      <div className="bc-orb bc-orb--lav" aria-hidden="true" />
      <div className="bc-orb bc-orb--gold" aria-hidden="true" />
      {/* ── floating particles ───────────────────────────────── */}
      {!reducedMotion &&
        particles.map((p) => (
          <div
            key={p.id}
            className="bc-particle"
            aria-hidden="true"
            style={{
              left: p.left,
              bottom: "-12px",
              width: p.size,
              height: p.size,
              "--mo": p.mo,
              "--dx": `${p.dx}px`,
              animation: `bc-float ${p.dur}s linear ${p.del}s infinite`,
            }}
          />
        ))}
      {/* ── card ─────────────────────────────────────────────── */}
      <motion.div
        className="bc-wrap"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <motion.article
          ref={cardRef}
          className="bc-card"
          style={{
            rotateX: reducedMotion ? 0 : sRotX,
            rotateY: reducedMotion ? 0 : sRotY,
          }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          aria-label="Birthday card"
        >
          {/* specular highlight */}
          {!reducedMotion && (
            <motion.div
              className="bc-spec"
              aria-hidden="true"
              style={{ x: sSX, y: sSY }}
            />
          )}
          {/* card sparkles */}
          {!reducedMotion &&
            sparkles.map((s) => (
              <span
                key={s.id}
                className="bc-sparkle"
                aria-hidden="true"
                style={{
                  left: s.left,
                  top: s.top,
                  "--dur": `${s.dur}s`,
                  "--del": `${s.del}s`,
                }}
              >
                ✦
              </span>
            ))}
          {/* ── card content ──────────────────────────────────── */}
          <motion.div
            className="bc-content"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* date */}
            <motion.p className="bc-date" variants={fadeUp} aria-label="August 9, 2026">
              August 9, 2026
            </motion.p>
            {/* title */}
            <motion.h1 className="bc-title" variants={fadeUp}>
              Happy Birthday
            </motion.h1>
            {/* subtitle */}
            <motion.p className="bc-sub" variants={fadeUp}>
              To My Dearest Sister
            </motion.p>
            {/* ── revealed section ────────────────────────────── */}
            {isRevealed && (
              <motion.div
                variants={revealContainer}
                initial="hidden"
                animate="visible"
              >
                {/* divider */}
                <motion.div className="bc-div" variants={revealItem} aria-hidden="true">
                  <span className="bc-div-line" />
                  <span className="bc-div-dot">✦</span>
                  <span className="bc-div-line" />
                </motion.div>
                {/* message */}
                <motion.p className="bc-msg" variants={revealItem}>
                  On this beautiful day, the world was given its most wonderful
                  gift&nbsp;— you. May this new chapter bring you quiet mornings
                  filled with wonder, adventures that make your heart race, and the
                  deep, unwavering knowing that you are loved beyond measure.
                </motion.p>
                {/* second divider */}
                <motion.div className="bc-div" variants={revealItem} aria-hidden="true">
                  <span className="bc-div-line" />
                  <span className="bc-div-dot">✦</span>
                  <span className="bc-div-line" />
                </motion.div>
                {/* signature */}
                <motion.p className="bc-sig" variants={revealItem}>
                  With all my love, always
                </motion.p>
              </motion.div>
            )}
            {/* ── CTA ────────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={{ position: "relative" }}>
              <button
                className="bc-cta"
                onClick={isRevealed ? celebrate : reveal}
                aria-label={
                  isRevealed ? "Celebrate again" : "Reveal birthday wishes"
                }
              >
                <span className="bc-cta-s" aria-hidden="true">✦</span>
                {isRevealed ? "Celebrate" : "Unveil My Wishes"}
                <span className="bc-cta-s" aria-hidden="true">✦</span>
              </button>
              {/* particle burst */}
              {showBurst && (
                <div className="bc-burst" aria-hidden="true">
                  {burstParts.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                      animate={{
                        x: Math.cos(p.angle) * p.dist,
                        y: Math.sin(p.angle) * p.dist,
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.75,
                        delay: p.del,
                        ease: EASE,
                      }}
                      style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: p.color,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.article>
      </motion.div>
    </section>
  );
};
export default BirthdayCard;
