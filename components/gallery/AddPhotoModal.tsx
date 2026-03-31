// Modal for uploading one or more photos to the gallery with optional shared caption.
// Used by GalleryFeed on /gallery. Supports multi-file select and drag-and-drop.
"use client";

import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/theme";

export interface AddPhotoData {
  file: File;
  caption: string;
  aspectRatio: number;
}

interface AddPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddPhotoData[]) => Promise<void>;
}

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  aspectRatio: number;
}

export function AddPhotoModal({ open, onClose, onSubmit }: AddPhotoModalProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (submitting) return;
    entries.forEach((e) => URL.revokeObjectURL(e.preview));
    setEntries([]);
    setCaption("");
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    for (const file of selected) {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setEntries((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            file,
            preview: objectUrl,
            aspectRatio: img.naturalWidth / img.naturalHeight,
          },
        ]);
      };
      img.src = objectUrl;
    }

    e.target.value = "";
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((e) => e.id !== id);
    });
  }

  async function handleSubmit() {
    if (entries.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(
        entries.map(({ file, aspectRatio }) => ({
          file,
          caption: caption.trim(),
          aspectRatio,
        }))
      );
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  const uploadLabel =
    entries.length === 0
      ? "Upload"
      : entries.length === 1
        ? "Upload Photo"
        : `Upload ${entries.length} Photos`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-0">
          <DialogTitle
            className="text-xl leading-tight"
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 700,
              color: theme.textHeading,
            }}
          >
            Add Photos
          </DialogTitle>
          <div
            className="h-[2px] w-8 rounded-full mt-2"
            style={{ background: theme.gold }}
          />
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {entries.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed transition-colors"
              style={{
                borderColor: theme.border,
                color: theme.textSecondary,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  `${theme.primary}50`;
                (e.currentTarget as HTMLButtonElement).style.color =
                  theme.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  theme.border;
                (e.currentTarget as HTMLButtonElement).style.color =
                  theme.textSecondary;
              }}
              disabled={submitting}
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Click to select photos</span>
              <span
                className="text-xs"
                style={{ color: theme.textDim }}
              >
                You can select multiple at once
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div key={entry.id} className="relative aspect-square">
                  <img
                    src={entry.preview}
                    alt=""
                    className="w-full h-full object-cover rounded-md"
                  />
                  {!submitting && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {!submitting && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed transition-colors"
                  style={{
                    borderColor: theme.border,
                    color: theme.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      `${theme.primary}50`;
                    (e.currentTarget as HTMLButtonElement).style.color =
                      theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      theme.border;
                    (e.currentTarget as HTMLButtonElement).style.color =
                      theme.textSecondary;
                  }}
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add more</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="photo-caption"
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.textSecondary }}
            >
              Caption{" "}
              <span
                className="normal-case font-normal tracking-normal"
                style={{ color: theme.textDim }}
              >
                (optional{entries.length > 1 ? ", applies to all" : ""})
              </span>
            </label>
            <Textarea
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening in these photos?"
              rows={2}
              disabled={submitting}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={entries.length === 0 || submitting}
            className="font-semibold transition-opacity hover:opacity-90"
            style={{ background: theme.primary, color: "white", border: "none" }}
          >
            {submitting ? "Uploading…" : uploadLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
