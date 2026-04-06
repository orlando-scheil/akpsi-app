// Type definitions for announcements and their comments.
export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  imageUrls: string[];
  createdAt: Date;
  likedBy: string[];
  commentCount: number;
}

export interface AnnouncementComment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
}
