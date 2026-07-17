import GalleryHeader from "./GalleryHeader";
import GalleryGrid from "./GalleryGrid";
import { galleryImages } from "../../data/gallery";

/**
 * Gallery
 *
 * Premium photo gallery section.
 * Composes:
 * - GalleryHeader
 * - GalleryGrid
 *
 * Data is currently sourced from a local data file and can later be
 * replaced by a CMS, JSON file, or API without changing the UI layer.
 */
export default function Gallery() {
  return (
    <section
      aria-labelledby="gallery-heading"
      className="flex min-h-screen flex-col gap-16 px-6 py-24 sm:gap-20 sm:px-10 md:px-16 lg:px-20"
    >
      {/* Section heading */}
      <GalleryHeader />

      {/* Gallery grid */}
      <GalleryGrid photos={galleryImages} />
    </section>
  );
}