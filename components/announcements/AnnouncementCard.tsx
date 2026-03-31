// Single announcement card — displays author, timestamp, body text, and optional images.
// Shows a delete option (via ⋯ menu) when onDelete is provided (i.e. current user is author).
"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Announcement } from "@/types/announcement";
import { formatRelativeTime } from "@/lib/utils";
import { theme } from "@/lib/theme";

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => Promise<void>;
}

export function AnnouncementCard({ announcement, onDelete }: AnnouncementCardProps) {
  const { title, body, authorName, authorAvatar, imageUrls, createdAt } = announcement;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: hovered ? theme.bgCardHover : theme.bgCard,
          borderLeft: `4px solid ${theme.primary}`,
          boxShadow: hovered ? theme.shadowCardHover : theme.shadowCard,
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-0">
          <Avatar
            className="h-9 w-9 shrink-0"
            style={{ outline: `2px solid ${theme.primary}25`, outlineOffset: "1px" }}
          >
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: theme.primary, color: "white" }}
            >
              {authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-tight truncate"
              style={{ color: theme.textPrimary }}
            >
              {authorName}
            </p>
            <p
              className="text-xs leading-tight mt-px"
              style={{ color: theme.textSecondary }}
            >
              {formatRelativeTime(createdAt)}
            </p>
          </div>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-7 w-7 items-center justify-center rounded-md focus-visible:outline-none transition-all"
                style={{
                  color: hovered ? theme.textSecondary : "transparent",
                }}
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pt-3 pb-4">
          <h3
            className="text-[0.95rem] font-semibold mb-1.5 leading-snug"
            style={{
              fontFamily: "var(--font-display, serif)",
              color: theme.textPrimary,
            }}
          >
            {title}
          </h3>
          <p
            className="text-sm whitespace-pre-line leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            {body}
          </p>
        </div>

        {imageUrls.length > 0 && (
          <div className="px-5 pb-4">
            {imageUrls.length === 1 ? (
              <img
                src={imageUrls[0]}
                alt={`Image for ${title}`}
                className="w-full rounded-lg max-h-96 object-cover"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Image ${i + 1} for ${title}`}
                    className="w-full rounded-lg h-48 object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !deleting && setConfirmOpen(open)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove &ldquo;{title}&rdquo;. This action
            cannot be undone.
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
