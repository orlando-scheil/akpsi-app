// Custom React Flow node for an active or alumni member in the family tree.
// Used by FamilyTreeGraph on /family-tree.
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/member";

export interface MemberNodeData {
  member: Member;
  familyColor: string;
}

export function MemberNode({ data, selected }: NodeProps) {
  const { member, familyColor } = data as unknown as MemberNodeData;
  const displayName = member.preferredName ?? member.firstName;
  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`;
  const isAlumni = member.status === "alumni";

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: familyColor }} />

      <div
        className={cn(
          "bg-white rounded-xl shadow-sm border-2 px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-shadow",
          "hover:shadow-md",
          selected ? "ring-2 ring-offset-2" : "",
          isAlumni ? "opacity-75" : ""
        )}
        style={{
          borderColor: familyColor,
          width: 168,
          ...(selected ? { boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${familyColor}` } : {}),
        }}
      >
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
          style={{ backgroundColor: familyColor }}
        >
          {member.profilePhotoUrl ? (
            <img
              src={member.profilePhotoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate leading-tight">
            {displayName} {member.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
            {member.pledgeClassQuarter} &apos;{String(member.pledgeClassYear).slice(-2)}
            {member.role ? ` · ${member.role}` : ""}
          </p>
          {isAlumni && (
            <span className="inline-block text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-1 rounded leading-tight mt-0.5">
              Alumni
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: familyColor }} />
    </>
  );
}
