// Type definition for chapter announcements displayed on the Announcements feed.
export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  imageUrls: string[];
  createdAt: Date;
}
