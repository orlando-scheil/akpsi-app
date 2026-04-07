// Type definitions for member profiles powering the Directory page and future Firebase schema.
export interface SocialLink {
  platform: string;
  url: string;
}

/**
 * Member profile document.
 * Firestore path: `users/{uid}`
 *
 * Status values: "active" | "alumni" | "inactive"
 * Pledge classes use the quarter/year the class crossed over (Fall or Spring at UW).
 */
export interface Member {
  uid: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  profilePhotoUrl: string | null;
  pledgeClassQuarter: "Fall" | "Spring";
  pledgeClassYear: number;
  status: "active" | "alumni" | "inactive";
  role: string | null;
  familyId: string | null;
  /** Display name for the family line (e.g. "The Thunder Family"). Future feature — null until set. */
  familyName: string | null;
  /** uid of this member's big. Null if they have no big or their big is unknown. */
  bigUid: string | null;
  /** Display name fallback for bigs not in the database (graduated, pre-app era, etc.) */
  bigName: string | null;
  major: string;
  graduationYear: number;
  email: string;
  phone: string | null;
  preferredContact: string | null;
  socialLinks: SocialLink[];
  bio: string | null;
  industries: string[];
  joinedAt: Date;
  lastActive: Date;
  isAdmin: boolean;
}

export type MemberSortKey =
  | "lastName"
  | "pledgeClassYear"
  | "major"
  | "graduationYear"
  | "status"
  | "role";
