// Search and sort logic for the member directory — holistic filtering and column sorting.
import type { Member, MemberSortKey } from "@/types/member";

export function filterMembers(members: Member[], query: string): Member[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return members;

  return members.filter((m) =>
    tokens.every((token) => memberMatchesToken(m, token))
  );
}

function memberMatchesToken(m: Member, token: string): boolean {
  const stringFields = [
    m.firstName,
    m.lastName,
    m.preferredName,
    m.pledgeClassQuarter,
    m.major,
    m.status,
    m.role,
    m.email,
  ];

  for (const field of stringFields) {
    if (field && field.toLowerCase().includes(token)) return true;
  }

  if (String(m.graduationYear).startsWith(token)) return true;
  if (String(m.pledgeClassYear).startsWith(token)) return true;

  const pledgeLabel =
    `${m.pledgeClassQuarter} ${m.pledgeClassYear}`.toLowerCase();
  if (pledgeLabel.includes(token)) return true;

  return false;
}

const QUARTER_ORDER: Record<string, number> = { Spring: 0, Fall: 1 };

export function sortMembers(
  members: Member[],
  key: MemberSortKey,
  direction: "asc" | "desc"
): Member[] {
  const sorted = [...members].sort((a, b) => {
    if (key === "graduationYear") {
      const diff = a.graduationYear - b.graduationYear;
      if (diff !== 0) return diff;
      return a.lastName.localeCompare(b.lastName);
    }

    if (key === "pledgeClassYear") {
      const yearDiff = a.pledgeClassYear - b.pledgeClassYear;
      if (yearDiff !== 0) return yearDiff;
      const qDiff =
        (QUARTER_ORDER[a.pledgeClassQuarter] ?? 0) -
        (QUARTER_ORDER[b.pledgeClassQuarter] ?? 0);
      if (qDiff !== 0) return qDiff;
      return a.lastName.localeCompare(b.lastName);
    }

    const aVal = a[key] ?? "";
    const bVal = b[key] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal));
    if (cmp !== 0) return cmp;
    return a.lastName.localeCompare(b.lastName);
  });

  if (direction === "desc") sorted.reverse();
  return sorted;
}
