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
 * Pledge classes use Greek letter names (Alpha, Beta, Gamma, etc.)
 * with the quarter/year the class crossed over (Fall or Spring at UW).
 */
export interface Member {
  uid: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  profilePhotoUrl: string | null;
  pledgeClass: string;
  pledgeClassQuarter: "Fall" | "Spring";
  pledgeClassYear: number;
  status: "active" | "alumni" | "inactive";
  role: string | null;
  familyId: string | null;
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
  | "pledgeClass"
  | "major"
  | "graduationYear"
  | "status"
  | "role";
