// Modal form for creating a new announcement with title, body, and optional image uploads.
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/theme";

interface CreateAnnouncementData {
  title: string;
  body: string;
  files: File[];
}

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementData) => Promise<void>;
}

export function CreateAnnouncementModal({
  open,
  onClose,
  onSubmit,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  function handleClose() {
    if (submitting) return;
    setTitle("");
    setBody("");
    setFiles([]);
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), files });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-0">
          <DialogTitle
            className="text-xl leading-tight"
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 700,
              color: theme.textHeading,
            }}
          >
            New Announcement
          </DialogTitle>
          <div
            className="h-[2px] w-8 rounded-full mt-2"
            style={{ background: theme.gold }}
          />
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.textSecondary }}
            >
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.textSecondary }}
            >
              Message
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              disabled={submitting}
              required
              placeholder="What's the announcement?"
              className="resize-none"
            />
          </div>

          {/* Image picker */}
          <div className="flex flex-col gap-2">
            <label
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.textSecondary }}
            >
              Images{" "}
              <span
                className="normal-case font-normal tracking-normal"
                style={{ color: theme.textDim }}
              >
                (optional)
              </span>
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {files.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg"
                      style={{ border: `1px solid ${theme.border}` }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => fileInputRef.current?.click()}
              className="w-fit border-dashed transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add images
            </Button>
          </div>
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
            {submitting ? "Posting…" : "Post Announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
