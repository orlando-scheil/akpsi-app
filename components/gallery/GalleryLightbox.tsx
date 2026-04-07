// Lightbox overlay — displays a full-size photo with caption when clicked in the gallery.
// If the signed-in user is the uploader, shows a delete button with inline confirmation.
// Used by GalleryFeed on /gallery.
"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { GalleryPhoto } from "@/types/gallery";

interface GalleryLightboxProps {
  photo: GalleryPhoto;
  onClose: () => void;
  /** UID of the currently signed-in user — used to decide whether to show the delete button. */
  currentUserUid?: string;
  /**
   * Called when the user confirms deletion. The parent (GalleryFeed) is responsible for
   * the actual Firestore + Storage delete and for closing the lightbox afterward.
   */
  onDelete?: (photo: GalleryPhoto) => Promise<void>;
}

export function GalleryLightbox({ photo, onClose, currentUserUid, onDelete }: GalleryLightboxProps) {
  // Two-step confirmation: first click shows "Are you sure?", second click confirms.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // The delete button is only shown if the signed-in user uploaded this photo.
  // uploadedByUid is optional because photos uploaded before this feature was added
  // won't have the field — in that case we simply hide the button.
  const canDelete =
    !!onDelete &&
    !!photo.uploadedByUid &&
    photo.uploadedByUid === currentUserUid;

  // Close on Escape, and cancel the delete confirmation on Escape if it's open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmingDelete) {
          setConfirmingDelete(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirmingDelete]);

  async function handleConfirmDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(photo);
      // onDelete closes the lightbox, so no need to call onClose here.
    } catch (err) {
      setDeleteError((err as Error).message ?? "Failed to delete photo.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      {/* Top-right controls: delete (owner only) + close */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {canDelete && (
          confirmingDelete ? (
            // Confirmation state — shown after the first delete click.
            <div
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white text-xs font-medium">Delete photo?</span>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-white/70 text-xs hover:text-white transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-red-400 text-xs font-semibold hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          ) : (
            // Initial state — show the trash icon button.
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(true);
              }}
              aria-label="Delete photo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500/60 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )
        )}

        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {deleteError && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-red-900/80 px-4 py-2 text-white text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {deleteError}
        </div>
      )}

      <div
        className="flex flex-col items-center gap-3 max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.imageUrl}
          alt={photo.caption ?? "Gallery photo"}
          className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        {(photo.caption || photo.uploadedBy) && (
          <div className="text-center">
            {photo.caption && (
              <p className="text-white font-medium">{photo.caption}</p>
            )}
            <p className="text-white/60 text-sm mt-0.5">Uploaded by {photo.uploadedBy}</p>
          </div>
        )}
      </div>
    </div>
  );
}
