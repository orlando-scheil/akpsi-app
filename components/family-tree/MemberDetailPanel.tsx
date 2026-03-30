// Slide-in detail panel shown when a member node is clicked in the family tree.
// Displays profile info, big/little relationships, and contact links.
import { X } from "lucide-react";
import type { Member } from "@/types/member";

interface MemberDetailPanelProps {
  member: Member;
  members: Member[];
  onClose: () => void;
}

export function MemberDetailPanel({ member, members, onClose }: MemberDetailPanelProps) {
  const displayName = member.preferredName ?? member.firstName;
  const big = member.bigUid ? members.find((m) => m.uid === member.bigUid) : null;
  const littles = members.filter((m) => m.bigUid === member.uid);

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-56px)] w-72 bg-white border-l shadow-xl z-10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Member Profile</h2>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 pt-1">
          {member.profilePhotoUrl ? (
            <img
              src={member.profilePhotoUrl}
              alt={`${displayName} ${member.lastName}`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
              {member.firstName[0] ?? ""}{member.lastName[0] ?? ""}
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-sm">
              {displayName} {member.lastName}
            </p>
            {member.role && (
              <p className="text-xs text-muted-foreground">{member.role}</p>
            )}
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${
              member.status === "active"
                ? "bg-green-100 text-green-700"
                : member.status === "alumni"
                ? "bg-blue-100 text-blue-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
        )}

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-xs">
          <Row label="Pledge Class" value={`${member.pledgeClass} · ${member.pledgeClassQuarter} '${String(member.pledgeClassYear).slice(-2)}`} />
          <Row label="Major" value={member.major} />
          <Row label="Grad Year" value={String(member.graduationYear)} />
          {member.email && <Row label="Email" value={member.email} />}
          {member.phone && <Row label="Phone" value={member.phone} />}
        </div>

        {/* Big */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Big</p>
          {big ? (
            <div className="flex items-center gap-2">
              {big.profilePhotoUrl ? (
                <img src={big.profilePhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {big.firstName[0] ?? ""}{big.lastName[0] ?? ""}
                </div>
              )}
              <span className="text-xs">{big.preferredName ?? big.firstName} {big.lastName}</span>
            </div>
          ) : member.bigName ? (
            <p className="text-xs text-muted-foreground italic">{member.bigName} (not in directory)</p>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        {/* Littles */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Littles{littles.length > 0 ? ` (${littles.length})` : ""}
          </p>
          {littles.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {littles.map((little) => (
                <div key={little.uid} className="flex items-center gap-2">
                  {little.profilePhotoUrl ? (
                    <img src={little.profilePhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">
                      {little.firstName[0] ?? ""}{little.lastName[0] ?? ""}
                    </div>
                  )}
                  <span className="text-xs">{little.preferredName ?? little.firstName} {little.lastName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No littles yet</p>
          )}
        </div>

        {/* Social links */}
        {member.socialLinks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Links</p>
            <div className="flex flex-col gap-1">
              {member.socialLinks.map((link) => {
                const safeUrl =
                  link.url.startsWith("https://") || link.url.startsWith("http://")
                    ? link.url
                    : null;
                return safeUrl ? (
                  <a
                    key={link.platform}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {link.platform}
                  </a>
                ) : (
                  <span key={link.platform} className="text-xs text-muted-foreground">
                    {link.platform}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
