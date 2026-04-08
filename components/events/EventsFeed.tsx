// EventsFeed — Main orchestrator for the Events page.
// Manages view mode (list/calendar), create/edit modal, and ICS export.
"use client";

import { useState, type JSX } from "react";
import { CalendarDays, List, CalendarPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsListView } from "./EventsListView";
import { EventsCalendarView } from "./EventsCalendarView";
import { EventFormModal } from "./EventFormModal";
import { useAuth } from "@/lib/auth";
import { useEvents } from "@/lib/events-context";
import { deleteEvent, deleteAnnouncement } from "@/lib/firestore";
import { downloadICS } from "@/lib/events";
import { theme } from "@/lib/theme";
import type { Event } from "@/types/event";

type View = "list" | "calendar";

export function EventsFeed(): JSX.Element {
  const { user, member } = useAuth();
  const { events, loading, error } = useEvents();

  const [view, setView] = useState<View>("list");
  /** null = closed, "new" = create mode, Event object = edit mode */
  const [formTarget, setFormTarget] = useState<Event | "new" | null>(null);

  const isAdmin = member?.isAdmin ?? false;

  async function handleDelete(id: string): Promise<void> {
    const ev = events.find((e) => e.id === id);
    await deleteEvent(id);
    if (ev?.linkedAnnouncementId) {
      await deleteAnnouncement(ev.linkedAnnouncementId);
    }
  }

  function handleExport() {
    downloadICS(events.filter((ev) => ev.startDate >= new Date()));
  }

  const sharedViewProps = {
    events,
    currentUserUid: user?.uid ?? null,
    isAdmin,
    onEdit: (ev: Event) => setFormTarget(ev),
    onDelete: handleDelete,
  };

  return (
    <div className="min-h-screen" style={{ background: theme.bgPage }}>
      {/* Page header */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.25em] uppercase mb-2"
              style={{ color: theme.primaryMuted }}
            >
              Chapter Calendar
            </p>
            <h1
              className="text-[2rem] leading-tight"
              style={{
                fontFamily: "var(--font-display, serif)",
                fontWeight: 700,
                color: theme.textHeading,
              }}
            >
              Events
            </h1>
            <div
              className="mt-2.5 h-[2px] w-10 rounded-full"
              style={{ background: theme.gold }}
            />
          </div>

          <div className="flex items-center gap-2 mb-0.5">
            {/* View toggle */}
            <div
              className="flex items-center rounded-lg p-0.5 gap-0.5"
              style={{ background: theme.border }}
            >
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: view === "list" ? theme.bgCard : "transparent",
                  color: view === "list" ? theme.textPrimary : theme.textSecondary,
                  boxShadow: view === "list" ? theme.shadowCard : "none",
                }}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setView("calendar")}
                aria-label="Calendar view"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: view === "calendar" ? theme.bgCard : "transparent",
                  color: view === "calendar" ? theme.textPrimary : theme.textSecondary,
                  boxShadow: view === "calendar" ? theme.shadowCard : "none",
                }}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>

            {/* Export */}
            {events.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm border-dashed transition-colors hover:border-primary/40 hover:text-primary"
                onClick={handleExport}
              >
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}

            {/* New Event */}
            <Button
              onClick={() => setFormTarget("new")}
              className="gap-1.5 text-sm font-semibold border-0 shadow-sm transition-all"
              style={{ background: theme.gold, color: theme.primaryDark }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = theme.goldHover)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = theme.gold)
              }
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Event</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
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
            Failed to load events: {error}
          </p>
        )}

        {!loading && !error && view === "list" && (
          <EventsListView {...sharedViewProps} />
        )}

        {!loading && !error && view === "calendar" && (
          <EventsCalendarView {...sharedViewProps} />
        )}
      </div>

      {/* Create / Edit modal — keyed by target so state resets on each open */}
      <EventFormModal
        key={formTarget === null ? "closed" : typeof formTarget === "object" ? formTarget.id : "new"}
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        existing={typeof formTarget === "object" && formTarget ? formTarget : undefined}
        authorId={user?.uid ?? ""}
        authorName={
          member
            ? `${member.preferredName ?? member.firstName} ${member.lastName}`
            : (user?.displayName ?? "Member")
        }
        authorAvatar={member?.profilePhotoUrl ?? user?.photoURL ?? undefined}
      />
    </div>
  );
}
