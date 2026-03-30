// Single announcement card — displays author, timestamp, body text, and optional images.
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Announcement } from "@/types/announcement";
import { formatRelativeTime } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { title, body, authorName, authorAvatar, imageUrls, createdAt } =
    announcement;

  return (
    <Card className="border transition-shadow hover:shadow-md">
      {/* Header: avatar + author + timestamp */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorAvatar} alt={authorName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {authorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-tight">{authorName}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </p>
        </div>
      </div>

      <CardContent className="pt-3">
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {body}
        </p>
      </CardContent>

      {imageUrls.length > 0 && (
        <div className="px-6 pb-6">
          {imageUrls.length === 1 ? (
            <img
              src={imageUrls[0]}
              alt={`Image for ${title}`}
              className="w-full rounded-md max-h-96 object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Image ${i + 1} for ${title}`}
                  className="w-full rounded-md h-48 object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
