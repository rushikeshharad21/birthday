import GalleryCard from "./GalleryCard";

/**
 * GalleryGrid
 *
 * Responsive layout grid for GalleryCard entries. Pure layout
 * component — owns no animation, no data fetching, no accessibility
 * logic beyond what's structurally necessary (GalleryCard handles its
 * own image alt text and motion).
 *
 * Mobile: 1 column · Small: 2 columns · Large: 3 columns.
 *
 * @param {Array<{ id: string|number, image: string, alt: string }>} photos
 */
export default function GalleryGrid({ photos }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
      {photos?.map((photo, index) => (
        <GalleryCard key={photo.id} photo={photo} index={index} />
      ))}
    </div>
  );
}