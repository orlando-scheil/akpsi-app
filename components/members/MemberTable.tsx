// Sortable member table with clickable column headers for the Directory page.
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
} from "@mui/material";
import type { Member, MemberSortKey } from "@/types/member";
import { MemberRow } from "./MemberRow";

interface Column {
  key: MemberSortKey;
  label: string;
  width: string;
}

const COLUMNS: Column[] = [
  { key: "lastName", label: "Name", width: "30%" },
  { key: "pledgeClass", label: "Pledge Class", width: "18%" },
  { key: "major", label: "Major", width: "22%" },
  { key: "graduationYear", label: "Grad Year", width: "10%" },
  { key: "status", label: "Status", width: "10%" },
  { key: "role", label: "Role", width: "10%" },
];

interface MemberTableProps {
  members: Member[];
  sortKey: MemberSortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: MemberSortKey) => void;
}

export function MemberTable({
  members,
  sortKey,
  sortDirection,
  onSortChange,
}: MemberTableProps) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderColor: "divider", overflowX: "auto" }}
    >
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableCell
                key={col.key}
                sx={{ width: col.width, fontWeight: 600 }}
              >
                <TableSortLabel
                  active={sortKey === col.key}
                  direction={sortKey === col.key ? sortDirection : "asc"}
                  onClick={() => onSortChange(col.key)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} sx={{ py: 6, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No members found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <MemberRow key={member.uid} member={member} />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
