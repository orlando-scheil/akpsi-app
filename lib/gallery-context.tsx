// Persistent gallery cache — holds photos and pagination cursor at session level.
// Prevents flash of empty content on re-navigation. Consumed by GalleryFeed.
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getGalleryPage } from "@/lib/firestore";
import type { GalleryPhoto } from "@/types/gallery";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface GalleryContextValue {
  photos: GalleryPhoto[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  prependPhotos: (photos: GalleryPhoto[]) => void;
}

const GalleryContext = createContext<GalleryContextValue | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <GalleryContext.Provider value={{ photos, loading, loadingMore, hasMore, error, loadMore, prependPhotos }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
}
