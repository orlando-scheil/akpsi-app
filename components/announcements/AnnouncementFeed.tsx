// Main orchestrator for the Announcements page — manages the feed list and new-post modal.
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {announcements.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No announcements yet. Be the first to post!
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
