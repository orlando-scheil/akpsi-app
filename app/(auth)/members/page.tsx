// Directory page — member profiles and contact info.
// Protected by the (auth) layout; only visible to signed-in members.
import { Typography, Box } from "@mui/material";

export default function MembersPage() {
  return (
    <Box className="p-8">
      <Typography variant="h4" component="h1">
        Directory
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Coming soon.
      </Typography>
    </Box>
  );
}
