// EventCard — Displays a single chapter event with date badge, details, and calendar actions.
// Used by EventsListView and EventsCalendarView on /events.
"use client";

import { useState, type JSX } from "react";
import { MapPin, Link2, Pencil, Trash2, MoreHorizontal, CalendarPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { buildGoogleCalendarUrl } from "@/lib/events";
import { theme } from "@/lib/theme";
import type { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
  currentUserUid: string | null;
  isAdmin: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => Promise<void>;
  /** Compact mode used inside the calendar day panel — less padding, no avatar. */
  compact?: boolean;
}

const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(start: Date, end?: Date): string {
  const startStr = formatTime(start);
  return end ? `${startStr} – ${formatTime(end)}` : startStr;
}

export function EventCard({
  event,
  currentUserUid,
  isAdmin,
  onEdit,
  onDelete,
  compact = false,
}: EventCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canAct = currentUserUid === event.authorId || isAdmin;
  const canEdit = onEdit && canAct;
  const canDelete = onDelete && canAct;
  const showMenu = canEdit || canDelete;

  const isPast = event.startDate < new Date();
  const month = MONTH_ABBR[event.startDate.getMonth()];
  const day = event.startDate.getDate();
  const year = event.startDate.getFullYear();
  const currentYear = new Date().getFullYear();

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden transition-all duration-200 flex"
        style={{
          background: hovered ? theme.bgCardHover : theme.bgCard,
          boxShadow: hovered ? theme.shadowCardHover : theme.shadowCard,
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          opacity: isPast ? 0.72 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Date badge */}
        <div
          className="flex flex-col items-center justify-center shrink-0 px-4 py-4"
          style={{
            background: isPast ? theme.border : theme.primary,
            minWidth: compact ? "56px" : "68px",
          }}
        >
          <span
            className="text-[9px] font-bold tracking-[0.18em] leading-none"
            style={{ color: isPast ? theme.textSecondary : `${theme.gold}cc` }}
          >
            {month}
          </span>
          <span
            className={`font-bold leading-none mt-0.5 ${compact ? "text-xl" : "text-3xl"}`}
            style={{ color: isPast ? theme.textSecondary : "white" }}
          >
            {day}
          </span>
          {year !== currentYear && (
            <span
              className="text-[9px] leading-none mt-0.5"
              style={{ color: isPast ? theme.textDim : `${theme.gold}99` }}
            >
              {year}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="font-semibold leading-snug"
                style={{
                  color: theme.textPrimary,
                  fontSize: compact ? "0.85rem" : "0.95rem",
                }}
              >
                {event.title}
              </h3>
              {/* Time */}
              <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                {formatTimeRange(event.startDate, event.endDate)}
              </p>
            </div>

            {showMenu && !compact && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-all focus-visible:outline-none shrink-0"
                  style={{ color: hovered ? theme.textSecondary : "transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = theme.border;
                    (e.currentTarget as HTMLButtonElement).style.color = theme.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = hovered
                      ? theme.textSecondary
                      : "transparent";
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onEdit!(event)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canEdit && canDelete && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {!compact && (
            <p
              className="text-sm mt-1.5 leading-relaxed line-clamp-2"
              style={{ color: theme.textSecondary }}
            >
              {event.description}
            </p>
          )}

          {/* Meta chips */}
          {(event.location || event.link) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {event.location && (
                <span
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: theme.textSecondary }}
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  {event.location}
                </span>
              )}
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs hover:underline transition-colors"
                  style={{ color: theme.primary }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="h-3 w-3 shrink-0" />
                  Link
                </a>
              )}
            </div>
          )}

          {/* Footer: author + calendar button */}
          {!compact && (
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={event.authorAvatar} alt={event.authorName} />
                  <AvatarFallback
                    className="text-[9px] font-bold"
                    style={{ background: theme.primary, color: "white" }}
                  >
                    {event.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs" style={{ color: theme.textDim }}>
                  {event.authorName}
                </span>
              </div>

              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs border-dashed transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Add to Calendar
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !deleting && setConfirmOpen(open)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove &ldquo;{event.title}&rdquo;. This cannot
            be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
