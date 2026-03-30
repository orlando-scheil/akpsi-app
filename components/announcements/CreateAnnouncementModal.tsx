// Modal form for creating a new announcement with title, body, and optional image URLs.
"use client";

import { useState } from "react";
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

interface CreateAnnouncementData {
  title: string;
  body: string;
  imageUrls: string[];
}

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementData) => void;
}

export function CreateAnnouncementModal({
  open,
  onClose,
  onSubmit,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  function handleClose() {
    setTitle("");
    setBody("");
    setImageUrl("");
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;

    const urls = imageUrl
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      body: body.trim(),
      imageUrls: urls,
    });

    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              What&apos;s the announcement?
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Image URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional, comma-separated)
              </span>
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
