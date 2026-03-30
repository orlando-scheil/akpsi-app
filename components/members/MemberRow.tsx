// Single row in the member directory table — avatar, name, pledge class, major, status, and role.
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/member";

const STATUS_CLASSES: Record<Member["status"], string> = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  alumni: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  inactive: "bg-orange-100 text-orange-800 hover:bg-orange-100",
};

interface MemberRowProps {
  member: Member;
}

export function MemberRow({ member }: MemberRowProps) {
  const displayName = member.preferredName ?? member.firstName;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={member.profilePhotoUrl ?? undefined}
              alt={`${member.firstName} ${member.lastName}`}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {member.firstName.charAt(0)}
              {member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-semibold block">
              {displayName} {member.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{member.email}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline">
          {`${member.pledgeClassQuarter} '${String(member.pledgeClassYear).slice(-2)} · ${member.pledgeClass}`}
        </Badge>
      </TableCell>

      <TableCell>
        <span className="text-sm">{member.major}</span>
      </TableCell>

      <TableCell>
        <span className="text-sm">{member.graduationYear}</span>
      </TableCell>

      <TableCell>
        <Badge
          className={cn(
            "text-xs font-semibold border-0",
            STATUS_CLASSES[member.status]
          )}
        >
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </Badge>
      </TableCell>

      <TableCell>
        <span
          className={cn(
            "text-sm",
            member.role ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {member.role ?? "—"}
        </span>
      </TableCell>
    </TableRow>
  );
}
