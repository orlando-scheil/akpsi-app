// Main orchestrator for the Directory page — manages search, sort state, and renders the table.
"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    <div
      className="py-8"
      style={{
        paddingLeft: "max(1rem, calc(50vw - 40rem))",
        paddingRight: "max(1rem, calc(50vw - 40rem))",
      }}
    >
      <h1 className="text-2xl font-semibold mb-6">Directory</h1>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, major, pledge class, year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Showing {processedMembers.length} of {MOCK_MEMBERS.length} members
      </p>

      <MemberTable
        members={processedMembers}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
