// Main gallery component — masonry column layout with photo lightbox and add photo modal.
// Fetches from Firestore with pagination; uploads to Firebase Storage on add.
// Supports shuffle mode (random sampling) and owner-only photo deletion.
"use client";

import { useState, useEffect, useCallback } from "react";
import { ImagePlus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useGallery } from "@/lib/gallery-context";
import { createGalleryPhoto, deleteGalleryPhoto } from "@/lib/firestore";
import { uploadGalleryPhoto, deleteStorageFile } from "@/lib/storage";
import type { GalleryPhoto } from "@/types/gallery";
import { theme } from "@/lib/theme";
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
  const {
    photos,
    loading,
    loadingMore,
    hasMore,
    error,
    shuffleLoading,
    isShuffled,
    loadMore,
    prependPhotos,
    shufflePhotos,
    removePhoto,
  } = useGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const columnCount = useColumnCount();

  const handleAddPhoto = useCallback(
    async (items: { file: File; caption: string; aspectRatio: number }[]) => {
      const uid = user?.uid ?? "unknown";
      const displayName = user?.displayName ?? user?.email ?? "Unknown";

      const uploaded = await Promise.all(
        items.map(({ file }) => uploadGalleryPhoto(uid, file))
      );

      await Promise.all(
        uploaded.map(({ url, storagePath }, i) =>
          createGalleryPhoto({
            imageUrl: url,
            storagePath,
            caption: items[i].caption || undefined,
            uploadedBy: displayName,
            uploadedByUid: uid,
            aspectRatio: items[i].aspectRatio,
          })
        )
      );

      // Optimistically prepend the new photos so they appear immediately without a re-fetch.
      const newPhotos: GalleryPhoto[] = uploaded.map(({ url, storagePath }, i) => ({
        id: crypto.randomUUID(),
        imageUrl: url,
        storagePath,
        caption: items[i].caption || undefined,
        uploadedBy: displayName,
        uploadedByUid: uid,
        uploadedAt: new Date(),
        aspectRatio: items[i].aspectRatio,
      }));

      prependPhotos(newPhotos);
    },
    [user, prependPhotos]
  );

  // Delete the currently open photo from both Firestore and Firebase Storage,
  // then remove it from the local cache and close the lightbox.
  const handleDelete = useCallback(
    async (photo: GalleryPhoto) => {
      await Promise.all([
        deleteGalleryPhoto(photo.id),
        photo.storagePath ? deleteStorageFile(photo.storagePath) : Promise.resolve(),
      ]);
      removePhoto(photo.id);
      setSelectedPhoto(null);
    },
    [removePhoto]
  );

  const columns = distributeIntoColumns(photos, columnCount);

  return (
    <div className="min-h-screen" style={{ background: theme.bgPage }}>
      <div className="max-w-[1600px] mx-auto px-4 pt-10 pb-8">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.25em] uppercase mb-2"
              style={{ color: theme.primaryMuted }}
            >
              Chapter Memories
            </p>
            <h1
              className="text-[2rem] leading-tight"
              style={{
                fontFamily: "var(--font-display, serif)",
                fontWeight: 700,
                color: theme.textHeading,
              }}
            >
              Gallery
            </h1>
            <div
              className="mt-2.5 h-[2px] w-10 rounded-full"
              style={{ background: theme.gold }}
            />
          </div>

          <div className="flex items-center gap-2 mb-0.5">
            {/* Shuffle button — toggles between random and newest-first ordering.
                Highlighted in gold when shuffle mode is active. */}
            <Button
              variant="outline"
              onClick={shufflePhotos}
              disabled={shuffleLoading || loading}
              className="gap-2 text-sm font-semibold shadow-sm transition-all"
              style={
                isShuffled
                  ? { background: theme.gold, color: theme.primaryDark, borderColor: theme.gold }
                  : { borderColor: theme.border, color: theme.textSecondary }
              }
            >
              {shuffleLoading ? (
                <div
                  className="h-4 w-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: `${theme.primary}40`,
                    borderTopColor: isShuffled ? theme.primaryDark : theme.primary,
                  }}
                />
              ) : (
                <Shuffle className="h-4 w-4" />
              )}
              {isShuffled ? "Shuffled" : "Shuffle"}
            </Button>

            <Button
              onClick={() => setModalOpen(true)}
              className="gap-2 text-sm font-semibold border-0 shadow-sm transition-all"
              style={{ background: theme.gold, color: theme.primaryDark }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = theme.goldHover)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = theme.gold)
              }
            >
              <ImagePlus className="h-4 w-4" />
              Add Photo
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div
              className="h-5 w-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${theme.primary}40`,
                borderTopColor: theme.primary,
              }}
            />
            <p className="text-xs tracking-wide" style={{ color: theme.textDim }}>
              Loading…
            </p>
          </div>
        )}

        {error && (
          <p className="text-center py-16 text-sm text-destructive">
            Failed to load gallery: {error}
          </p>
        )}

        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No photos yet. Be the first to add one!
            </p>
          </div>
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
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ borderColor: theme.border, color: theme.textSecondary }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedPhoto && (
        <GalleryLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          currentUserUid={user?.uid}
          onDelete={handleDelete}
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
