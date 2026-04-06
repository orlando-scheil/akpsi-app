// Main orchestrator for the Announcements page — manages the feed list and new-post modal.
// Subscribes to Firestore in real time; uploads images to Storage before writing the doc.
"use client";

import { useState } from "react";
import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useAnnouncements } from "@/lib/announcements-context";
import { createAnnouncement, deleteAnnouncement } from "@/lib/firestore";
import { uploadAnnouncementImages } from "@/lib/storage";
import { theme } from "@/lib/theme";
import { AnnouncementCard } from "./AnnouncementCard";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";

export function AnnouncementFeed() {
  const { user } = useAuth();
  const { announcements, loading, error } = useAnnouncements();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleCreate(data: {
    title: string;
    body: string;
    files: File[];
  }): Promise<void> {
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
    <div className="min-h-screen" style={{ background: theme.bgPage }}>
      {/* Page header */}
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.25em] uppercase mb-2"
              style={{ color: theme.primaryMuted }}
            >
              Chapter Updates
            </p>
            <h1
              className="text-[2rem] leading-tight"
              style={{
                fontFamily: "var(--font-display, serif)",
                fontWeight: 700,
                color: theme.textHeading,
              }}
            >
              Announcements
            </h1>
            <div
              className="mt-2.5 h-[2px] w-10 rounded-full"
              style={{ background: theme.gold }}
            />
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="mb-0.5 gap-2 text-sm font-semibold border-0 shadow-sm transition-all"
            style={{ background: theme.gold, color: theme.primaryDark }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = theme.goldHover)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = theme.gold)
            }
          >
            <PenSquare className="h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div
              className="h-5 w-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${theme.primary}40`,
                borderTopColor: theme.primary,
              }}
            />
            <p className="text-xs tracking-wide" style={{ color: theme.textDim }}>
              Loading…
            </p>
          </div>
        )}

        {error && (
          <p className="text-center py-16 text-sm text-destructive">
            Failed to load announcements: {error}
          </p>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No announcements yet.
            </p>
            <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              Be the first to post!
            </p>
          </div>
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className="flex flex-col gap-4">
            {announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                currentUser={
                  user
                    ? { uid: user.uid, name: user.displayName ?? "Member", avatar: user.photoURL ?? undefined }
                    : null
                }
                onDelete={
                  a.authorId === user?.uid
                    ? () => deleteAnnouncement(a.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
