// Persistent events cache — holds the real-time Firestore subscription at session level.
// Prevents flash of empty content on re-navigation. Consumed by EventsFeed.
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type JSX } from "react";
import { subscribeToEvents } from "@/lib/firestore";
import type { Event } from "@/types/event";

interface EventsContextValue {
  events: Event[];
  loading: boolean;
  error: string | null;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

interface EventsProviderProps {
  children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps): JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToEvents(
      (data) => {
        setEvents(data);
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
    <EventsContext.Provider value={{ events, loading, error }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
