// Main orchestrator for the Directory page — manages search, sort state, and renders the table.
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMembers } from "@/lib/firestore";
import { filterMembers, sortMembers } from "@/lib/search-members";
import type { Member, MemberSortKey } from "@/types/member";
import { MemberTable } from "./MemberTable";

export function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<MemberSortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const processedMembers = useMemo(() => {
    const filtered = filterMembers(members, searchQuery);
    return sortMembers(filtered, sortKey, sortDirection);
  }, [members, searchQuery, sortKey, sortDirection]);

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

      {error && (
        <p className="text-destructive mb-4">
          Failed to load members: {error}
        </p>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, major, pledge class, year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {loading
          ? "Loading members…"
          : `Showing ${processedMembers.length} of ${members.length} members`}
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
