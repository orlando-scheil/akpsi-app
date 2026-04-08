// EventsListView — Chronological list of events split into Upcoming and Past sections.
// Used by EventsFeed on /events when the list view is active.
"use client";

import { useMemo, type JSX } from "react";
import { EventCard } from "./EventCard";
import { theme } from "@/lib/theme";
import type { Event } from "@/types/event";

interface EventsListViewProps {
  events: Event[];
  currentUserUid: string | null;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => Promise<void>;
}

export function EventsListView({
  events,
  currentUserUid,
  isAdmin,
  onEdit,
  onDelete,
}: EventsListViewProps): JSX.Element {
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming: Event[] = [];
    const past: Event[] = [];
    for (const ev of events) {
      if (ev.startDate >= now) upcoming.push(ev);
      else past.push(ev);
    }
    // upcoming is already asc by startDate (from Firestore); past is most-recent first
    past.reverse();
    return { upcoming, past };
  }, [events]);

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: theme.textSecondary }}>
          No events scheduled yet.
        </p>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          Create the first one!
        </p>
      </div>
    );
  }

  const cardProps = { currentUserUid, isAdmin, onEdit, onDelete };

  return (
    <div className="flex flex-col gap-8">
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: theme.primaryMuted }}
            >
              Upcoming
            </p>
            <div className="flex-1 h-px" style={{ background: theme.border }} />
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} event={ev} {...cardProps} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: theme.textDim }}
            >
              Past
            </p>
            <div className="flex-1 h-px" style={{ background: theme.border }} />
          </div>
          <div className="flex flex-col gap-3">
            {past.map((ev) => (
              <EventCard key={ev.id} event={ev} {...cardProps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
