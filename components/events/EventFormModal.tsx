// EventFormModal — Create or edit a chapter event, with optional announcement cross-post.
// Used by EventsFeed on /events. Pass `existing` to switch to edit mode.
"use client";

import { useState, useEffect, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createEvent, updateEvent, createAnnouncement } from "@/lib/firestore";
import { toDatetimeLocal, fromDatetimeLocal } from "@/lib/events";
import { theme } from "@/lib/theme";
import type { Event, CreateEventData, UpdateEventData } from "@/types/event";

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Provide to open in edit mode — fields are pre-filled and submit calls updateEvent. */
  existing?: Event;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

const LABEL = "text-[10px] font-bold tracking-[0.18em] uppercase";
const OPT = "normal-case font-normal tracking-normal";

/** Format a cross-post announcement body from event fields. */
function buildAnnouncementBody(fields: {
  description: string;
  startDate: Date;
  location?: string;
  link?: string;
}): string {
  const dateStr = fields.startDate.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const lines = [`📅 ${dateStr}`];
  if (fields.location) lines.push(`📍 ${fields.location}`);
  if (fields.description) lines.push(`\n${fields.description}`);
  if (fields.link) lines.push(`\nMore info: ${fields.link}`);
  return lines.join("\n");
}

export function EventFormModal({
  open,
  onClose,
  existing,
  authorId,
  authorName,
  authorAvatar,
}: EventFormModalProps): JSX.Element {
  const isEdit = existing !== undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [alsoAnnounce, setAlsoAnnounce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync field state whenever the modal opens (or existing changes)
  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setStartDate(existing ? toDatetimeLocal(existing.startDate) : "");
    setEndDate(existing?.endDate ? toDatetimeLocal(existing.endDate) : "");
    setLocation(existing?.location ?? "");
    setLink(existing?.link ?? "");
    setAlsoAnnounce(false);
    setError(null);
  }, [open, existing]);

  const parsedStart = fromDatetimeLocal(startDate);
  const parsedEnd = fromDatetimeLocal(endDate);
  const endAfterStart = !parsedEnd || !parsedStart || parsedEnd > parsedStart;

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !!parsedStart &&
    endAfterStart;

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit() {
    if (!canSubmit || submitting || !parsedStart) return;
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        const update: UpdateEventData = {
          title: title.trim(),
          description: description.trim(),
          startDate: parsedStart,
          endDate: parsedEnd ?? null,
          location: location.trim() || null,
          link: link.trim() || null,
        };
        await updateEvent(existing.id, update);
      } else {
        // Create the announcement first (if toggled) so we can store its ID on the event.
        let linkedAnnouncementId: string | undefined;
        if (alsoAnnounce) {
          linkedAnnouncementId = await createAnnouncement({
            title: title.trim(),
            body: buildAnnouncementBody({
              description: description.trim(),
              startDate: parsedStart,
              location: location.trim() || undefined,
              link: link.trim() || undefined,
            }),
            authorId,
            authorName,
            authorAvatar,
            imageUrls: [],
          });
        }

        await createEvent({
          title: title.trim(),
          description: description.trim(),
          startDate: parsedStart,
          endDate: parsedEnd,
          location: location.trim() || undefined,
          link: link.trim() || undefined,
          authorId,
          authorName,
          authorAvatar,
          linkedAnnouncementId,
        });
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle
            className="text-xl leading-tight"
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 700,
              color: theme.textHeading,
            }}
          >
            {isEdit ? "Edit Event" : "New Event"}
          </DialogTitle>
          <div
            className="h-[2px] w-8 rounded-full mt-2"
            style={{ background: theme.gold }}
          />
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL} style={{ color: theme.textSecondary }}>
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={submitting}
              placeholder="Event name"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL} style={{ color: theme.textSecondary }}>
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder="What's happening?"
              className="resize-none"
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL} style={{ color: theme.textSecondary }}>
                Start
              </label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
                step={60}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL} style={{ color: theme.textSecondary }}>
                End{" "}
                <span className={OPT} style={{ color: theme.textDim }}>
                  (optional)
                </span>
              </label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
                step={60}
                aria-invalid={!endAfterStart || undefined}
              />
              {!endAfterStart && (
                <p className="text-xs text-destructive">End must be after start.</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL} style={{ color: theme.textSecondary }}>
              Location{" "}
              <span className={OPT} style={{ color: theme.textDim }}>
                (optional)
              </span>
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={submitting}
              placeholder="e.g. HUB 337"
            />
          </div>

          {/* Link */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL} style={{ color: theme.textSecondary }}>
              Link{" "}
              <span className={OPT} style={{ color: theme.textDim }}>
                (optional)
              </span>
            </label>
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={submitting}
              placeholder="https://zoom.com/..."
            />
          </div>

          {/* Also post as announcement — create mode only */}
          {!isEdit && (
            <label
              className="flex items-center gap-2.5 cursor-pointer select-none"
              style={{ color: theme.textSecondary }}
            >
              <input
                type="checkbox"
                checked={alsoAnnounce}
                onChange={(e) => setAlsoAnnounce(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded"
                style={{ accentColor: theme.primary }}
              />
              <span className="text-sm">Also post as announcement</span>
            </label>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="font-semibold transition-opacity hover:opacity-90"
            style={{ background: theme.primary, color: "white", border: "none" }}
          >
            {submitting
              ? isEdit ? "Saving…" : "Creating…"
              : isEdit ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
