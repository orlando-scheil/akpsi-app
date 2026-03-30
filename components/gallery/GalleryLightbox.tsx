// Lightbox overlay — displays a full-size photo with caption when clicked in the gallery.
// Used by GalleryFeed on /gallery.
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { GalleryPhoto } from "@/types/gallery";

interface GalleryLightboxProps {
  photo: GalleryPhoto;
  onClose: () => void;
}

export function GalleryLightbox({ photo, onClose }: GalleryLightboxProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="flex flex-col items-center gap-3 max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.imageUrl}
          alt={photo.caption ?? "Gallery photo"}
          className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        {(photo.caption || photo.uploadedBy) && (
          <div className="text-center">
            {photo.caption && (
              <p className="text-white font-medium">{photo.caption}</p>
            )}
            <p className="text-white/60 text-sm mt-0.5">Uploaded by {photo.uploadedBy}</p>
          </div>
        )}
      </div>
    </div>
  );
}
