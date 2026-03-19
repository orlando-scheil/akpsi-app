// Main orchestrator for the Announcements page — manages the feed list and new-post modal.
"use client";

import { useState } from "react";
import { Container, Typography, Button, Stack, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@/lib/auth";
import { MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import type { Announcement } from "@/types/announcement";
import { AnnouncementCard } from "./AnnouncementCard";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";

export function AnnouncementFeed() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreate(data: {
    title: string;
    body: string;
    imageUrls: string[];
  }) {
    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      title: data.title,
      body: data.body,
      imageUrls: data.imageUrls,
      authorId: user?.uid ?? "unknown",
      authorName: user?.displayName ?? "Unknown",
      authorAvatar: user?.photoURL ?? undefined,
      createdAt: new Date(),
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Announcements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          New Post
        </Button>
      </Box>

      {announcements.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No announcements yet. Be the first to post!
        </Typography>
      ) : (
        <Stack spacing={3}>
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </Stack>
      )}

      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </Container>
  );
}
