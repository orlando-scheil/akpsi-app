// Persistent gallery cache — holds photos and pagination state at session level.
// Prevents flash of empty content on re-navigation. Consumed by GalleryFeed.
//
// View modes:
//   "recent"  — default; photos ordered newest-first with infinite pagination.
//   "shuffle" — random sample via the stored `random` field on each document;
//               pagination is disabled in this mode (tap Shuffle again for a fresh batch).
//
// See lib/firestore.ts → getShuffledGalleryPage for how the random sampling works.
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getGalleryPage, getShuffledGalleryPage } from "@/lib/firestore";
import type { GalleryPhoto } from "@/types/gallery";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface GalleryContextValue {
  photos: GalleryPhoto[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  /** True while the shuffle fetch is in-flight — used to show a spinner on the button. */
  shuffleLoading: boolean;
  /** True when the current photo list came from a shuffle query rather than newest-first. */
  isShuffled: boolean;
  /** Load the next page. In "recent" mode this paginates by uploadedAt. Disabled in shuffle mode. */
  loadMore: () => Promise<void>;
  /** Optimistically add newly uploaded photos to the front of the list. */
  prependPhotos: (photos: GalleryPhoto[]) => void;
  /**
   * Toggle shuffle mode.
   * - If not yet shuffled: fetches a random PAGE_SIZE batch and replaces the current list.
   * - If already shuffled: resets to newest-first by re-fetching the first page.
   */
  shufflePhotos: () => Promise<void>;
  /** Remove a single photo from the cache after it has been deleted. */
  removePhoto: (id: string) => void;
}

const GalleryContext = createContext<GalleryContextValue | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);

  // Initial load: fetch the first page of photos ordered newest-first.
  // This only runs once per session — subsequent navigations use the cached state.
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

  // Load the next page of photos and append them to the current list.
  // Only available in "recent" mode — the shuffle mode disables hasMore so this
  // button never renders when the user is viewing a shuffled set.
  const loadMore = useCallback(async () => {
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
  }, [lastDoc, loadingMore]);

  const prependPhotos = useCallback((newPhotos: GalleryPhoto[]) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
  }, []);

  const shufflePhotos = useCallback(async () => {
    setShuffleLoading(true);
    try {
      if (isShuffled) {
        // Already in shuffle mode — reset to newest-first by re-fetching the first page.
        const { photos: data, lastDoc: cursor } = await getGalleryPage();
        setPhotos(data);
        setLastDoc(cursor);
        setHasMore(cursor !== null);
        setIsShuffled(false);
      } else {
        // Enter shuffle mode: fetch a random batch.
        // hasMore is set to false because pagination doesn't make sense in shuffle mode —
        // continuing from a random cursor would produce inconsistent results. The user
        // can tap Shuffle again to get a fresh random batch instead.
        const { photos: data } = await getShuffledGalleryPage();
        setPhotos(data);
        setLastDoc(null);
        setHasMore(false);
        setIsShuffled(true);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setShuffleLoading(false);
    }
  }, [isShuffled]);

  // Remove a photo from the local cache immediately after it has been deleted from
  // Firestore and Storage. This avoids a full re-fetch just to reflect a deletion.
  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <GalleryContext.Provider
      value={{
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
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
}
