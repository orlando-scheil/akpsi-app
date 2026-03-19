// Main orchestrator for the Directory page — manages search, sort state, and renders the table.
"use client";

import { useState, useMemo } from "react";
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { MOCK_MEMBERS } from "@/lib/mock-data";
import { filterMembers, sortMembers } from "@/lib/search-members";
import type { MemberSortKey } from "@/types/member";
import { MemberTable } from "./MemberTable";

export function MemberDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<MemberSortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const processedMembers = useMemo(() => {
    const filtered = filterMembers(MOCK_MEMBERS, searchQuery);
    return sortMembers(filtered, sortKey, sortDirection);
  }, [searchQuery, sortKey, sortDirection]);

  function handleSortChange(key: MemberSortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Directory
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by name, major, pledge class, year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {processedMembers.length} of {MOCK_MEMBERS.length} members
      </Typography>

      <MemberTable
        members={processedMembers}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </Container>
  );
}
