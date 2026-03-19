// Single row in the member directory table — avatar, name, pledge class, major, status, and role.
"use client";

import { TableRow, TableCell, Avatar, Chip, Typography, Box } from "@mui/material";
import type { Member } from "@/types/member";

const STATUS_COLORS: Record<Member["status"], { bg: string; text: string }> = {
  active: { bg: "#e8f5e9", text: "#2e7d32" },
  alumni: { bg: "#e3f2fd", text: "#1565c0" },
  inactive: { bg: "#fff3e0", text: "#e65100" },
};

interface MemberRowProps {
  member: Member;
}

export function MemberRow({ member }: MemberRowProps) {
  const displayName = member.preferredName ?? member.firstName;
  const statusColor = STATUS_COLORS[member.status];

  return (
    <TableRow sx={{ "&:hover": { bgcolor: "action.hover" } }}>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            src={member.profilePhotoUrl ?? undefined}
            sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.875rem" }}
          >
            {member.firstName.charAt(0)}
            {member.lastName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {displayName} {member.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {member.email}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          label={`${member.pledgeClassQuarter} '${String(member.pledgeClassYear).slice(-2)} · ${member.pledgeClass}`}
          variant="outlined"
          size="small"
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2">{member.major}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{member.graduationYear}</Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          size="small"
          sx={{
            bgcolor: statusColor.bg,
            color: statusColor.text,
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2" color={member.role ? "text.primary" : "text.disabled"}>
          {member.role ?? "—"}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
