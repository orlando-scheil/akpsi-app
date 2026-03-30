// Main orchestrator for the Announcements page — manages the feed list and new-post modal.
// Subscribes to Firestore in real time; uploads images to Storage before writing the doc.
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { subscribeToAnnouncements, createAnnouncement } from "@/lib/firestore";
import { uploadAnnouncementImages } from "@/lib/storage";
import type { Announcement } from "@/types/announcement";
import { AnnouncementCard } from "./AnnouncementCard";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";

export function AnnouncementFeed() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements(
      (data) => {
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  async function handleCreate(data: {
    title: string;
    body: string;
    files: File[];
  }): Promise<void> {
    // Use a temp ID for the storage path so we can upload before creating the doc
    const tempId = crypto.randomUUID();
    const imageUrls =
      data.files.length > 0
        ? await uploadAnnouncementImages(tempId, data.files)
        : [];

    await createAnnouncement({
      title: data.title,
      body: data.body,
      imageUrls,
      authorId: user?.uid ?? "unknown",
      authorName: user?.displayName ?? "Unknown",
      authorAvatar: user?.photoURL ?? undefined,
    });
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

      {loading && (
        <p className="text-center text-muted-foreground py-16">Loading...</p>
      )}

      {error && (
        <p className="text-center text-destructive py-16">
          Failed to load announcements: {error}
        </p>
      )}

      {!loading && !error && announcements.length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          No announcements yet. Be the first to post!
        </p>
      )}

      {!loading && !error && announcements.length > 0 && (
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
