import { lazy, Suspense } from "react";
import BirthdayBackground from "../components/background/BirthdayBackground";
import ScrollProgress from "../components/common/ScrollProgress";
import Reveal from "../components/common/Reveal";

import Hero from "../components/hero/Hero";
import Memories from "../components/memories/Memories";
import Gallery from "../components/gallery/Gallery";
import Letter from "../components/letter/Letter";
import FinalWish from "../components/finalWish/FinalWish";
import Footer from "../components/footer/Footer";

import useInViewport from "../hooks/utils/useInViewport";

// Code-split: BirthdayCake pulls in three.js, @react-three/fiber,
// @react-three/drei, @react-three/postprocessing — by far the heaviest
// dependency in the app.
const BirthdayCake = lazy(() => import("../components/cake/BirthdayCake"));

function CakeFallback() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
    </div>
  );
}

/**
 * IMPORTANT: React.lazy() alone only defers WHICH FILE the code lives in
 * — it does NOT defer WHEN that code runs. If <BirthdayCake> sits directly
 * in Home's JSX (even wrapped in <Suspense>), React starts fetching AND
 * mounting it on Home's very first render, regardless of scroll position,
 * because nothing tells React "don't render this yet." That's exactly why
 * the cake's ~9s of CPU cost was showing up in the performance profile
 * even before scrolling anywhere near it.
 *
 * The actual fix: don't put <BirthdayCake> in the tree at all until its
 * placeholder section is near the viewport. useInViewport (already built
 * for the fireworks trigger) does this — the lazy chunk only starts
 * fetching, and Three.js/WebGL only initializes, once the person has
 * scrolled close enough that they're about to see it.
 */
function LazyCakeSection() {
  const [sectionRef, isNear] = useInViewport({
    threshold: 0,
    rootMargin: "400px 0px", // start loading a bit before it's actually visible, so there's no visible pop-in once it does arrive
  });

  return (
    <div ref={sectionRef}>
      {isNear ? (
        <Suspense fallback={<CakeFallback />}>
          <BirthdayCake />
        </Suspense>
      ) : (
        <CakeFallback />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <BirthdayBackground />

      <ScrollProgress />

      <main style={{ position: "relative", zIndex: 1 }}>
        <Hero />

        <Memories />

        <Reveal delay={0.15}>
          <Gallery />
        </Reveal>

        <Reveal delay={0.2}>
          <LazyCakeSection />
        </Reveal>

        <Reveal delay={0.25}>
          <Letter />
        </Reveal>

        <Reveal delay={0.3}>
          <FinalWish />
        </Reveal>

        <Footer />
      </main>
    </>
  );
}