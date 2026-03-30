// Modal for uploading a photo to the gallery with an optional caption.
// Used by GalleryFeed on /gallery.
"use client";

import { useState, useRef } from "react";
import { ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AddPhotoData {
  file: File;
  caption: string;
  aspectRatio: number;
}

interface AddPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddPhotoData) => Promise<void>;
}

export function AddPhotoModal({ open, onClose, onSubmit }: AddPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (submitting) return;
    setFile(null);
    setPreview(null);
    setAspectRatio(1);
    setCaption("");
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const objectUrl = URL.createObjectURL(selected);
    const img = new Image();
    img.onload = () => {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    setFile(selected);
    setPreview(objectUrl);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!file || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ file, caption: caption.trim(), aspectRatio });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* File picker / preview */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg object-cover max-h-64"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/80 transition-colors"
                disabled={submitting}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors text-muted-foreground"
              disabled={submitting}
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Click to select a photo</span>
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="photo-caption" className="text-sm font-medium">
              Caption{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening in this photo?"
              rows={2}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || submitting}>
            {submitting ? "Uploading…" : "Add Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
