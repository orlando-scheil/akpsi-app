// Single row in the member directory table — avatar, name, pledge class, major, status, and role.
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import type { Member } from "@/types/member";
import { theme } from "@/lib/theme";

const STATUS_STYLES: Record<Member["status"], { bg: string; text: string }> = {
  active:   theme.statusActive,
  alumni:   theme.statusAlumni,
  inactive: theme.statusInactive,
};

interface MemberRowProps {
  member: Member;
}

export function MemberRow({ member }: MemberRowProps) {
  const displayName = member.preferredName ?? member.firstName;
  const statusStyle = STATUS_STYLES[member.status];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar
            className="h-9 w-9"
            style={{ outline: `2px solid ${theme.primary}20`, outlineOffset: "1px" }}
          >
            <AvatarImage
              src={member.profilePhotoUrl ?? undefined}
              alt={`${member.firstName} ${member.lastName}`}
            />
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: theme.primary, color: "white" }}
            >
              {member.firstName.charAt(0)}
              {member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span
              className="text-sm font-semibold block"
              style={{ color: theme.textPrimary }}
            >
              {displayName} {member.lastName}
            </span>
            <span className="text-xs" style={{ color: theme.textSecondary }}>
              {member.email}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: theme.border, color: theme.textSecondary }}
        >
          {`${member.pledgeClassQuarter} '${String(member.pledgeClassYear).slice(-2)} · ${member.pledgeClass}`}
        </Badge>
      </TableCell>

      <TableCell>
        <span className="text-sm" style={{ color: theme.textPrimary }}>
          {member.major}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-sm" style={{ color: theme.textPrimary }}>
          {member.graduationYear}
        </span>
      </TableCell>

      <TableCell>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </span>
      </TableCell>

      <TableCell>
        <span
          className="text-sm"
          style={{ color: member.role ? theme.textPrimary : theme.textDim }}
        >
          {member.role ?? "—"}
        </span>
      </TableCell>
    </TableRow>
  );
}
