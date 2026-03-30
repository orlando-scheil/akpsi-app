// Main gallery component — masonry column layout with photo lightbox and add photo modal.
// Used on /gallery.
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_GALLERY } from "@/lib/mock-data";
import type { GalleryPhoto } from "@/types/gallery";
import { GalleryPhotoCard } from "./GalleryPhotoCard";
import { GalleryLightbox } from "./GalleryLightbox";
import { AddPhotoModal } from "./AddPhotoModal";

function useColumnCount(): number {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setCols(2);
      else if (w < 1024) setCols(3);
      else if (w < 1280) setCols(4);
      else setCols(5);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

function distributeIntoColumns(items: GalleryPhoto[], cols: number): GalleryPhoto[][] {
  const columns: GalleryPhoto[][] = Array.from({ length: cols }, () => []);
  const heights = new Array<number>(cols).fill(0);

  for (const photo of items) {
    const ratio = photo.aspectRatio ?? 1;
    const shortestCol = heights.indexOf(Math.min(...heights));
    columns[shortestCol].push(photo);
    heights[shortestCol] += 1 / ratio; // taller image = larger height unit
  }

  return columns;
}

export function GalleryFeed() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    [...MOCK_GALLERY].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  );
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const columnCount = useColumnCount();

  const columns = distributeIntoColumns(photos, columnCount);

  const handleAddPhoto = useCallback(
    ({ imageUrl, caption, aspectRatio }: { imageUrl: string; caption: string; aspectRatio: number }) => {
      const newPhoto: GalleryPhoto = {
        id: `g-${Date.now()}`,
        imageUrl,
        caption: caption || undefined,
        uploadedBy: "You",
        uploadedAt: new Date(),
        aspectRatio,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
    },
    []
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Photo
        </Button>
      </div>

      <div className="flex gap-3 items-start">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-3">
            {col.map((photo) => (
              <GalleryPhotoCard
                key={photo.id}
                photo={photo}
                onClick={setSelectedPhoto}
              />
            ))}
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <GalleryLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <AddPhotoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPhoto}
      />
    </div>
  );
}
