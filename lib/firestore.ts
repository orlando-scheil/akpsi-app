// Firestore CRUD helpers for members, announcements, and gallery.
// All Firebase reads/writes go through here — components never call Firestore directly.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Member } from "@/types/member";
import type { Announcement } from "@/types/announcement";
import type { GalleryPhoto } from "@/types/gallery";

// ─── Converters ──────────────────────────────────────────────────────────────

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function announcementFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Announcement {
  const d = snap.data();
  return {
    id: snap.id,
    title: d.title,
    body: d.body,
    authorId: d.authorId,
    authorName: d.authorName,
    authorAvatar: d.authorAvatar ?? undefined,
    imageUrls: d.imageUrls ?? [],
    createdAt: toDate(d.createdAt),
  };
}

function memberFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Member {
  const d = snap.data();
  return {
    uid: snap.id,
    firstName: d.firstName,
    lastName: d.lastName,
    preferredName: d.preferredName ?? null,
    profilePhotoUrl: d.profilePhotoUrl ?? null,
    pledgeClass: d.pledgeClass,
    pledgeClassQuarter: d.pledgeClassQuarter,
    pledgeClassYear: d.pledgeClassYear,
    status: d.status,
    role: d.role ?? null,
    familyId: d.familyId ?? null,
    familyName: d.familyName ?? null,
    bigUid: d.bigUid ?? null,
    bigName: d.bigName ?? null,
    major: d.major,
    graduationYear: d.graduationYear,
    email: d.email,
    phone: d.phone ?? null,
    preferredContact: d.preferredContact ?? null,
    socialLinks: d.socialLinks ?? [],
    bio: d.bio ?? null,
    industries: d.industries ?? [],
    joinedAt: toDate(d.joinedAt),
    lastActive: toDate(d.lastActive),
    isAdmin: d.isAdmin ?? false,
  };
}

function galleryFromDoc(snap: QueryDocumentSnapshot<DocumentData>): GalleryPhoto {
  const d = snap.data();
  return {
    id: snap.id,
    imageUrl: d.imageUrl,
    storagePath: d.storagePath ?? undefined,
    caption: d.caption ?? undefined,
    uploadedBy: d.uploadedBy,
    uploadedAt: toDate(d.uploadedAt),
    aspectRatio: d.aspectRatio ?? undefined,
  };
}

// ─── Announcements ────────────────────────────────────────────────────────────

const announcementsCol = collection(db, "announcements");

/**
 * Subscribe to all announcements in real time, newest first.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToAnnouncements(
  onData: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(announcementsCol, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(announcementFromDoc)),
    onError
  );
}

export interface CreateAnnouncementData {
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  imageUrls: string[];
}

/** Create a new announcement. Returns the new document ID. */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<string> {
  const ref = await addDoc(announcementsCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Delete an announcement by ID. Caller must be the author. */
export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, "announcements", id));
}

// ─── Members ──────────────────────────────────────────────────────────────────

const usersCol = collection(db, "users");

/** Fetch all member profiles once. */
export async function getMembers(): Promise<Member[]> {
  const snap = await getDocs(usersCol);
  return snap.docs.map(memberFromDoc);
}

/** Fetch a single member profile by uid. Returns null if not found. */
export async function getMember(uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return memberFromDoc(snap as QueryDocumentSnapshot<DocumentData>);
}

/** Create or fully overwrite a member profile document. Used on first sign-in. */
export async function setMember(uid: string, data: Omit<Member, "uid">): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    joinedAt: data.joinedAt instanceof Date ? Timestamp.fromDate(data.joinedAt) : data.joinedAt,
    lastActive: serverTimestamp(),
  });
}

/** Partially update a member's own profile fields. */
export async function updateMember(
  uid: string,
  data: Partial<Omit<Member, "uid">>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    lastActive: serverTimestamp(),
  });
}

// ─── Big/little linking ───────────────────────────────────────────────────────

/**
 * Resolves big/little relationships by name after a member is created or their
 * name / bigName changes. Does two things:
 *
 * 1. If this member has a bigName but no bigUid, searches for a member whose
 *    firstName + lastName matches and patches bigUid onto this member's doc.
 *
 * 2. Scans all existing members for anyone who listed this member's name as
 *    their big but hasn't been linked yet, and patches their bigUid.
 *
 * Matching is case-insensitive exact on firstName + lastName.
 */
export async function linkBigLittles(
  uid: string,
  data: { firstName: string; lastName: string; bigName: string | null; bigUid: string | null }
): Promise<void> {
  const allMembers = await getMembers();
  const myFullName = `${data.firstName} ${data.lastName}`.toLowerCase().trim();
  const updates: Promise<void>[] = [];

  // 1. Resolve this member's own big if only the name was provided
  if (data.bigName && !data.bigUid) {
    const bigSearch = data.bigName.toLowerCase().trim();
    const bigMatch = allMembers.find(
      (m) =>
        m.uid !== uid &&
        `${m.firstName} ${m.lastName}`.toLowerCase().trim() === bigSearch
    );
    if (bigMatch) {
      updates.push(updateDoc(doc(db, "users", uid), { bigUid: bigMatch.uid }));
    }
  }

  // 2. Patch any existing unlinked littles who named this member as their big
  const unlinkedLittles = allMembers.filter(
    (m) =>
      m.uid !== uid &&
      m.bigUid === null &&
      m.bigName !== null &&
      m.bigName.toLowerCase().trim() === myFullName
  );
  for (const little of unlinkedLittles) {
    updates.push(updateDoc(doc(db, "users", little.uid), { bigUid: uid }));
  }

  await Promise.all(updates);
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

const galleryCol = collection(db, "gallery");

const GALLERY_PAGE_SIZE = 24;

/** Fetch the first page of gallery photos, newest first. */
export async function getGalleryPage(
  after?: QueryDocumentSnapshot<DocumentData>
): Promise<{ photos: GalleryPhoto[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints = after
    ? [orderBy("uploadedAt", "desc"), startAfter(after), limit(GALLERY_PAGE_SIZE)]
    : [orderBy("uploadedAt", "desc"), limit(GALLERY_PAGE_SIZE)];

  const q = query(galleryCol, ...constraints);
  const snap = await getDocs(q);
  const photos = snap.docs.map(galleryFromDoc);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { photos, lastDoc };
}

export interface CreateGalleryPhotoData {
  imageUrl: string;
  storagePath: string;
  caption?: string;
  uploadedBy: string;
  aspectRatio?: number;
}

/** Add a new gallery photo document. Returns the new document ID. */
export async function createGalleryPhoto(data: CreateGalleryPhotoData): Promise<string> {
  const ref = await addDoc(galleryCol, {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Delete a gallery photo document by ID. */
export async function deleteGalleryPhoto(id: string): Promise<void> {
  await deleteDoc(doc(db, "gallery", id));
}
