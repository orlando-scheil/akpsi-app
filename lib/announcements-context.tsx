// Persistent announcements cache — holds the real-time Firestore subscription at session level.
// Prevents flash of empty content on re-navigation. Consumed by AnnouncementFeed.
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeToAnnouncements } from "@/lib/firestore";
import type { Announcement } from "@/types/announcement";

interface AnnouncementsContextValue {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

const AnnouncementsContext = createContext<AnnouncementsContextValue | undefined>(undefined);

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements(
      (data) => {
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return (
    <AnnouncementsContext.Provider value={{ announcements, loading, error }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements(): AnnouncementsContextValue {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error("useAnnouncements must be used within AnnouncementsProvider");
  return ctx;
}
