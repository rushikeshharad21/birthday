import MemoriesHeader from "./MemoriesHeader";
import MemoryCard from "./MemoryCard";
import { memories } from "../../data/Memories.js";

/**
 * Memories
 *
 * Premium storytelling section.
 * Designed to sit on the global luxury background.
 */

export default function Memories() {
  return (
    <section
      id="memories"
      aria-labelledby="memories-heading"
      className="
        relative
        isolate
        overflow-hidden

        py-32
        sm:py-40

        px-6
        sm:px-10
        md:px-16
        lg:px-20
      "
    >
      {/* Soft radial glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10

          bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28)_0%,transparent_70%)]
        "
      />

      <div className="mx-auto max-w-7xl">
        <MemoriesHeader />

        <div className="mt-20 flex flex-col gap-14 lg:gap-20">
          {memories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              reverse={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}