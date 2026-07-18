import MemoriesHeader from "./MemoriesHeader";
import MemoryCard from "./MemoryCard";
import { memories } from "../../data/Memories.js"
/**
 * Temporary/inline sample data — replace with a real content source
 * (CMS, JSON, API) when available. Declared at module scope so it's
 * created once, not re-allocated on every render of Memories.
 */

/**
 * Memories
 *
 * Memory timeline section. Renders a MemoriesHeader followed by a
 * sequence of MemoryCard entries, alternating image/content order
 * on each card (even index: image left, odd index: image right)
 * to create a visual rhythm down the page.
 *
 * Data is temporary/inline pending a real content source — see
 * inline comment above. MemoryCard itself owns no data and accepts
 * only `memory` + `reverse`, per its existing API.
 */
export default function Memories() {
  return (
    <section
      aria-label="Memories timeline"
      className="flex min-h-screen flex-col gap-16 px-6 py-24 sm:gap-20 sm:px-10 md:px-16 lg:px-20"
    >
      <MemoriesHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 sm:gap-16">
        {memories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            reverse={index % 2 !== 0}
          />
        ))}
      </div>
    </section>
  );
}