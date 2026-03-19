// Modal form for creating a new announcement with title, body, and optional image URLs.
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>New Announcement</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          autoFocus
        />
        <TextField
          label="What's the announcement?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          required
          multiline
          minRows={4}
        />
        <TextField
          label="Image URL (optional, comma-separated for multiple)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          fullWidth
          placeholder="https://example.com/image.jpg"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
        >
          Post
        </Button>
      </DialogActions>
    </Dialog>
  );
}
