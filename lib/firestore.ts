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
  endBefore,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  deleteField,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Member } from "@/types/member";
import type { Announcement, AnnouncementComment } from "@/types/announcement";
import type { GalleryPhoto } from "@/types/gallery";
import type { Event, CreateEventData, UpdateEventData } from "@/types/event";

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
    likedBy: d.likedBy ?? [],
    commentCount: d.commentCount ?? 0,
  };
}

function commentFromDoc(snap: QueryDocumentSnapshot<DocumentData>): AnnouncementComment {
  const d = snap.data();
  return {
    id: snap.id,
    body: d.body,
    authorId: d.authorId,
    authorName: d.authorName,
    authorAvatar: d.authorAvatar ?? undefined,
    createdAt: toDate(d.createdAt),
    updatedAt: d.updatedAt ? toDate(d.updatedAt) : undefined,
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
    uploadedByUid: d.uploadedByUid ?? undefined,
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

/** Toggle a like on an announcement. Pass the current liked state to determine add vs. remove. */
export async function toggleLike(announcementId: string, uid: string, currentlyLiked: boolean): Promise<void> {
  await updateDoc(doc(db, "announcements", announcementId), {
    likedBy: currentlyLiked ? arrayRemove(uid) : arrayUnion(uid),
  });
}

/** Subscribe to comments on an announcement in real time, oldest first. */
export function subscribeToComments(
  announcementId: string,
  onData: (comments: AnnouncementComment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "announcements", announcementId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map(commentFromDoc)), onError);
}

export interface CreateCommentData {
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

/** Add a comment to an announcement and increment the comment count atomically. */
export async function addComment(announcementId: string, data: CreateCommentData): Promise<void> {
  const batch = writeBatch(db);
  const commentRef = doc(collection(db, "announcements", announcementId, "comments"));
  batch.set(commentRef, { ...data, createdAt: serverTimestamp() });
  batch.update(doc(db, "announcements", announcementId), { commentCount: increment(1) });
  await batch.commit();
}

/** Edit the body of a comment the current user owns. */
export async function updateComment(announcementId: string, commentId: string, body: string): Promise<void> {
  await updateDoc(doc(db, "announcements", announcementId, "comments", commentId), {
    body,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a comment and decrement the announcement's comment count atomically. */
export async function deleteComment(announcementId: string, commentId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "announcements", announcementId, "comments", commentId));
  batch.update(doc(db, "announcements", announcementId), { commentCount: increment(-1) });
  await batch.commit();
}

// ─── Allowlist ────────────────────────────────────────────────────────────────

/** Returns true if the email exists in the AKPsi-approved allowlist. */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "allowedEmails", email.toLowerCase()));
  return snap.exists();
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
  /** Firebase Auth UID of the uploader — stored so the delete button can be gated to the owner. */
  uploadedByUid?: string;
  aspectRatio?: number;
}

/**
 * Fetch a page of gallery photos in a pseudo-random order using the stored `random` field.
 *
 * How the random cursor technique works:
 * ─────────────────────────────────────
 * Every gallery document stores a `random` field: a float between 0 and 1 assigned at
 * upload time via Math.random(). Firestore maintains an index over this field.
 *
 * To get a random page we:
 *   1. Pick a random float (the "cursor") between 0 and 1.
 *   2. Query: orderBy("random").startAfter(cursor).limit(PAGE_SIZE)
 *      This jumps to a random position in the collection and grabs the next N documents.
 *
 * Wraparound:
 * ───────────
 * If the cursor lands near the end of the [0, 1) range there won't be enough documents
 * above it to fill a full page. In that case we run a second query from the beginning
 * of the range to fill the remaining slots. Because of this wraparound, we set
 * hasMore = false after the initial shuffle — "Load more" isn't supported in shuffle
 * mode (the user can tap Shuffle again for a fresh random batch instead).
 *
 * Cost: exactly PAGE_SIZE document reads per shuffle click, regardless of collection size.
 *
 * Limitation: only documents that have a `random` field are eligible. Photos uploaded
 * before this feature was added need a one-time migration (see scripts/add-random-field.ts).
 */
export async function getShuffledGalleryPage(): Promise<{
  photos: GalleryPhoto[];
}> {
  const randomCursor = Math.random();

  // Query 1: from the random cursor to the end of the [0, 1) range
  const q1 = query(
    galleryCol,
    orderBy("random"),
    startAfter(randomCursor),
    limit(GALLERY_PAGE_SIZE)
  );
  const snap1 = await getDocs(q1);
  const photos = snap1.docs.map(galleryFromDoc);

  // Wraparound: if we didn't fill a full page, the cursor landed near the top of the
  // range. Fetch the remaining slots from [0, cursor) to avoid duplicating the docs
  // already returned by q1 (which covers (cursor, 1]).
  if (photos.length < GALLERY_PAGE_SIZE) {
    const remaining = GALLERY_PAGE_SIZE - photos.length;
    const q2 = query(galleryCol, orderBy("random"), endBefore(randomCursor), limit(remaining));
    const snap2 = await getDocs(q2);
    photos.push(...snap2.docs.map(galleryFromDoc));
  }

  return { photos };
}

/** Add a new gallery photo document. Returns the new document ID. */
export async function createGalleryPhoto(data: CreateGalleryPhotoData): Promise<string> {
  const { caption, aspectRatio, uploadedByUid, ...required } = data;
  const ref = await addDoc(galleryCol, {
    ...required,
    ...(caption !== undefined && { caption }),
    ...(aspectRatio !== undefined && { aspectRatio }),
    ...(uploadedByUid !== undefined && { uploadedByUid }),
    // A random float [0, 1) stored at write time. Used by getShuffledGalleryPage to
    // efficiently sample random documents without fetching the entire collection.
    // See getShuffledGalleryPage for the full explanation of how this works.
    random: Math.random(),
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Delete a gallery photo document by ID. */
export async function deleteGalleryPhoto(id: string): Promise<void> {
  await deleteDoc(doc(db, "gallery", id));
}

// ─── Events ───────────────────────────────────────────────────────────────────

const eventsCol = collection(db, "events");

function eventFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Event {
  const d = snap.data();
  return {
    id: snap.id,
    title: d.title,
    description: d.description,
    startDate: toDate(d.startDate),
    endDate: d.endDate ? toDate(d.endDate) : undefined,
    location: d.location ?? undefined,
    link: d.link ?? undefined,
    authorId: d.authorId,
    authorName: d.authorName,
    authorAvatar: d.authorAvatar ?? undefined,
    createdAt: toDate(d.createdAt),
    linkedAnnouncementId: d.linkedAnnouncementId ?? undefined,
  };
}

/**
 * Subscribe to all events in real time, ordered by startDate ascending.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToEvents(
  onData: (events: Event[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(eventsCol, orderBy("startDate", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(eventFromDoc)),
    onError
  );
}

/** Create a new event. Returns the new document ID. */
export async function createEvent(data: CreateEventData): Promise<string> {
  const { startDate, endDate, location, link, authorAvatar, linkedAnnouncementId, ...rest } = data;
  const ref = await addDoc(eventsCol, {
    ...rest,
    startDate: Timestamp.fromDate(startDate),
    ...(endDate !== undefined && { endDate: Timestamp.fromDate(endDate) }),
    ...(location !== undefined && { location }),
    ...(link !== undefined && { link }),
    ...(authorAvatar !== undefined && { authorAvatar }),
    ...(linkedAnnouncementId !== undefined && { linkedAnnouncementId }),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Partially update an event's mutable fields. Pass null to clear an optional field. */
export async function updateEvent(id: string, data: UpdateEventData): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.startDate !== undefined) payload.startDate = Timestamp.fromDate(data.startDate);
  if ("endDate" in data) payload.endDate = data.endDate ? Timestamp.fromDate(data.endDate) : deleteField();
  if ("location" in data) payload.location = data.location ?? deleteField();
  if ("link" in data) payload.link = data.link ?? deleteField();
  await updateDoc(doc(db, "events", id), payload);
}

/** Delete an event by ID. Caller must be the author or an admin. */
export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}
