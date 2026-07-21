import BirthdayBackground from "../components/background/BirthdayBackground";
import ScrollProgress from "../components/common/ScrollProgress";
import Reveal from "../components/common/Reveal";

import Hero from "../components/hero/Hero";
import Memories from "../components/memories/Memories";
import Gallery from "../components/gallery/Gallery";
import BirthdayCake from "../components/cake/BirthdayCake";
import Letter from "../components/letter/Letter";
import FinalWish from "../components/finalWish/FinalWish";

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
          <BirthdayCake />
        </Reveal>

        <Reveal delay={0.25}>
          <Letter />
        </Reveal>

        <Reveal delay={0.3}>
          <FinalWish />
        </Reveal>
      </main>
    </>
  );
}