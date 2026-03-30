// Type definition for chapter gallery photos displayed on the Gallery page.
export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Date;
  /** width / height — used for shortest-column masonry distribution. Defaults to 1 if unknown. */
  aspectRatio?: number;
}
