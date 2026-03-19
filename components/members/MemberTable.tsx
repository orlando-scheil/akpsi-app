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
  minWidth?: number;
}

const COLUMNS: Column[] = [
  { key: "lastName", label: "Name", minWidth: 220 },
  { key: "pledgeClass", label: "Pledge Class" },
  { key: "major", label: "Major", minWidth: 160 },
  { key: "graduationYear", label: "Grad Year" },
  { key: "status", label: "Status" },
  { key: "role", label: "Role" },
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
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableCell
                key={col.key}
                sx={{ minWidth: col.minWidth, fontWeight: 600 }}
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
