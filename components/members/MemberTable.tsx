// Sortable member table with clickable column headers for the Directory page.
"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member, MemberSortKey } from "@/types/member";
import { theme } from "@/lib/theme";
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
    <div className="rounded-xl border overflow-x-auto" style={{ borderColor: theme.border }}>
      <Table style={{ tableLayout: "fixed" }}>
        <TableHeader>
          <TableRow style={{ borderBottomColor: theme.border }}>
            {COLUMNS.map((col) => {
              const active = sortKey === col.key;
              const SortIcon = active
                ? sortDirection === "asc"
                  ? ArrowUp
                  : ArrowDown
                : ArrowUpDown;

              return (
                <TableHead key={col.key} style={{ width: col.width }}>
                  <button
                    onClick={() => onSortChange(col.key)}
                    className="flex items-center gap-1 text-sm font-semibold transition-colors"
                    style={{
                      color: active ? theme.primary : theme.textSecondary,
                    }}
                  >
                    {col.label}
                    <SortIcon
                      className="h-3.5 w-3.5"
                      style={{ color: active ? theme.primary : theme.textDim }}
                    />
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length}
                className="py-10 text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <MemberRow key={member.uid} member={member} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
