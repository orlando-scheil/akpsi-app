// Top navigation bar — shown on all authenticated pages.
// Contains links to main sections and a sign-out button.
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import CampaignIcon from "@mui/icons-material/Campaign";
import PeopleIcon from "@mui/icons-material/People";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Announcements", href: "/announcements", icon: CampaignIcon },
  { label: "Directory", href: "/members", icon: PeopleIcon },
  { label: "Family Tree", href: "/family-tree", icon: AccountTreeIcon },
];

export default function Navbar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ position: "relative" }}>
        <Typography
          variant="h6"
          component={Link}
          href="/announcements"
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          AKPsi
        </Typography>

        <Box
          className="flex gap-1"
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Button
                key={href}
                component={Link}
                href={href}
                startIcon={<Icon />}
                sx={{
                  color: "inherit",
                  opacity: active ? 1 : 0.7,
                  borderBottom: active ? "2px solid white" : "2px solid transparent",
                  borderRadius: 0,
                  "&:hover": { opacity: 1 },
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Sign out">
          <IconButton color="inherit" onClick={signOut} aria-label="Sign out">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
