// Type definition for chapter gallery photos displayed on the Gallery page.
export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  /** Full Firebase Storage path — used to delete the file when the doc is deleted. */
  storagePath?: string;
  caption?: string;
  uploadedBy: string;
  /** Firebase Auth UID of the uploader — used to gate the delete button to the owner only. */
  uploadedByUid?: string;
  uploadedAt: Date;
  /** width / height — used for shortest-column masonry distribution. Defaults to 1 if unknown. */
  aspectRatio?: number;
}
