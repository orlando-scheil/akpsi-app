// Single announcement card — displays author, timestamp, body text, and optional images.
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import type { Announcement } from "@/types/announcement";
import { formatRelativeTime } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { title, body, authorName, authorAvatar, imageUrls, createdAt } =
    announcement;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "divider",
        "&:hover": { boxShadow: 2 },
        transition: "box-shadow 0.2s ease-in-out",
      }}
    >
      <CardHeader
        avatar={
          <Avatar src={authorAvatar} sx={{ bgcolor: "primary.main" }}>
            {authorName.charAt(0)}
          </Avatar>
        }
        title={authorName}
        subheader={formatRelativeTime(createdAt)}
        titleTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }}
        subheaderTypographyProps={{ fontSize: "0.8rem" }}
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
          {body}
        </Typography>
      </CardContent>

      {imageUrls.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          {imageUrls.length === 1 ? (
            <CardMedia
              component="img"
              image={imageUrls[0]}
              alt={`Image for ${title}`}
              sx={{ borderRadius: 1, maxHeight: 400, objectFit: "cover" }}
            />
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {imageUrls.map((url, i) => (
                <CardMedia
                  key={i}
                  component="img"
                  image={url}
                  alt={`Image ${i + 1} for ${title}`}
                  sx={{ borderRadius: 1, height: 200, objectFit: "cover" }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
}
