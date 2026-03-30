// Main gallery component — masonry column layout with photo lightbox and add photo modal.
// Fetches from Firestore with pagination; uploads to Firebase Storage on add.
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getGalleryPage, createGalleryPhoto } from "@/lib/firestore";
import { uploadGalleryPhoto } from "@/lib/storage";
import type { GalleryPhoto } from "@/types/gallery";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
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

function distributeIntoColumns(
  items: GalleryPhoto[],
  cols: number
): GalleryPhoto[][] {
  const columns: GalleryPhoto[][] = Array.from({ length: cols }, () => []);
  const heights = new Array<number>(cols).fill(0);

  for (const photo of items) {
    const ratio = photo.aspectRatio ?? 1;
    const shortestCol = heights.indexOf(Math.min(...heights));
    columns[shortestCol].push(photo);
    heights[shortestCol] += 1 / ratio;
  }

  return columns;
}

export function GalleryFeed() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const columnCount = useColumnCount();

  useEffect(() => {
    getGalleryPage()
      .then(({ photos: data, lastDoc: cursor }) => {
        setPhotos(data);
        setLastDoc(cursor);
        setHasMore(cursor !== null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleLoadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { photos: more, lastDoc: cursor } = await getGalleryPage(lastDoc);
      setPhotos((prev) => [...prev, ...more]);
      setLastDoc(cursor);
      setHasMore(cursor !== null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  const handleAddPhoto = useCallback(
    async ({
      file,
      caption,
      aspectRatio,
    }: {
      file: File;
      caption: string;
      aspectRatio: number;
    }) => {
      const uid = user?.uid ?? "unknown";
      const displayName = user?.displayName ?? user?.email ?? "Unknown";

      const { url, storagePath } = await uploadGalleryPhoto(uid, file);

      await createGalleryPhoto({
        imageUrl: url,
        storagePath,
        caption: caption || undefined,
        uploadedBy: displayName,
        aspectRatio,
      });

      // Prepend optimistically — Firestore isn't real-time for gallery
      const newPhoto: GalleryPhoto = {
        id: crypto.randomUUID(),
        imageUrl: url,
        storagePath,
        caption: caption || undefined,
        uploadedBy: displayName,
        uploadedAt: new Date(),
        aspectRatio,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
    },
    [user]
  );

  const columns = distributeIntoColumns(photos, columnCount);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Photo
        </Button>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-16">Loading…</p>
      )}

      {error && (
        <p className="text-center text-destructive py-16">
          Failed to load gallery: {error}
        </p>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          No photos yet. Be the first to add one!
        </p>
      )}

      {!loading && !error && photos.length > 0 && (
        <>
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

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}

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
