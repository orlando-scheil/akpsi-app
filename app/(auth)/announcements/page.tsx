// Announcements page — placeholder for the announcements feed.
// Protected by the (auth) layout; only visible to signed-in members.
import { Typography, Box } from "@mui/material";

export default function AnnouncementsPage() {
  return (
    <Box className="p-8">
      <Typography variant="h4" component="h1">
        Announcements
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Coming soon.
      </Typography>
    </Box>
  );
}
