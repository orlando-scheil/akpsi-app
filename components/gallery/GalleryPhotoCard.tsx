// Single photo card for the gallery — image with hover caption overlay.
// Used in the masonry columns in GalleryFeed on /gallery.
import type { GalleryPhoto } from "@/types/gallery";

interface GalleryPhotoCardProps {
  photo: GalleryPhoto;
  onClick: (photo: GalleryPhoto) => void;
}

export function GalleryPhotoCard({ photo, onClick }: GalleryPhotoCardProps) {
  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-muted"
      onClick={() => onClick(photo)}
    >
      <img
        src={photo.imageUrl}
        alt={photo.caption ?? "Gallery photo"}
        className="w-full block transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        {photo.caption && (
          <p className="text-white text-sm font-medium leading-snug">{photo.caption}</p>
        )}
        <p className="text-white/70 text-xs mt-0.5">{photo.uploadedBy}</p>
      </div>
    </div>
  );
}
