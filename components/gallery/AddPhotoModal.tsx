// Modal for adding a new photo to the gallery via URL and optional caption.
// Used by GalleryFeed on /gallery.
"use client";

import { useState, useRef } from "react";
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

interface AddPhotoData {
  imageUrl: string;
  caption: string;
  aspectRatio: number;
}

interface AddPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddPhotoData) => void;
}

export function AddPhotoModal({ open, onClose, onSubmit }: AddPhotoModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const aspectRatioRef = useRef<number>(1);

  function handleClose() {
    setImageUrl("");
    setCaption("");
    aspectRatioRef.current = 1;
    onClose();
  }

  function handleSubmit() {
    if (!imageUrl.trim()) return;
    onSubmit({
      imageUrl: imageUrl.trim(),
      caption: caption.trim(),
      aspectRatio: aspectRatioRef.current,
    });
    handleClose();
  }

  function handleUrlBlur() {
    const url = imageUrl.trim();
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        aspectRatioRef.current = img.naturalWidth / img.naturalHeight;
      }
    };
    img.src = url;
  }

  const canSubmit = imageUrl.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="photo-url" className="text-sm font-medium">
              Image URL
            </label>
            <Input
              id="photo-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://example.com/photo.jpg"
              autoFocus
            />
          </div>

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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Add Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
