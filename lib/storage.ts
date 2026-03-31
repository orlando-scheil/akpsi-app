// Firebase Storage upload/delete helpers for avatars, announcement images, and gallery photos.
// All storage operations go through here — components never call Firebase Storage directly.
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export type UploadProgressCallback = (progress: number) => void;

// ─── Internal helper ─────────────────────────────────────────────────────────

function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap: UploadTaskSnapshot) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

/**
 * Upload a member's profile photo.
 * Returns the public download URL.
 * Path: avatars/{uid}/{filename}
 */
export async function uploadAvatar(
  uid: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `avatars/${uid}/avatar.${ext}`;
  return uploadFile(path, file, onProgress);
}

// ─── Announcement images ──────────────────────────────────────────────────────

/**
 * Upload one image attached to an announcement.
 * Returns the public download URL.
 * Path: announcements/{announcementId}/{filename}
 */
export async function uploadAnnouncementImage(
  announcementId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}.${ext}`;
  const path = `announcements/${announcementId}/${filename}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload multiple announcement images in parallel.
 * Returns an array of download URLs in the same order as the input files.
 */
export async function uploadAnnouncementImages(
  announcementId: string,
  files: File[]
): Promise<string[]> {
  return Promise.all(
    files.map((file) => uploadAnnouncementImage(announcementId, file))
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

/**
 * Upload a gallery photo.
 * Returns the public download URL and the storage path (needed to delete later).
 * Path: gallery/{uid}/{filename}
 */
export async function uploadGalleryPhoto(
  uid: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; storagePath: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}_${crypto.randomUUID()}.${ext}`;
  const storagePath = `gallery/${uid}/${filename}`;
  const url = await uploadFile(storagePath, file, onProgress);
  return { url, storagePath };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from Storage by its full path (e.g. "gallery/uid/filename.jpg").
 * Silently succeeds if the file doesn't exist.
 */
export async function deleteStorageFile(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (err: unknown) {
    // "object-not-found" is not an error worth surfacing
    if ((err as { code?: string }).code !== "storage/object-not-found") {
      throw err;
    }
  }
}
