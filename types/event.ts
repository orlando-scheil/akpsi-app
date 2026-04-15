// Type definitions for chapter events shown on the Events page.
// Used by eventFromDoc in lib/firestore.ts and all Events UI components.

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  link?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  /** ID of the announcement auto-created alongside this event, if any. */
  linkedAnnouncementId?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  link?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  linkedAnnouncementId?: string;
}

/** Partial update — null explicitly clears an optional field from Firestore. */
export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date | null;
  location?: string | null;
  link?: string | null;
}
