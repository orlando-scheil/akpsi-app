// Slide-in detail panel shown when a member node is clicked in the family tree.
// Displays profile info, big/little relationships, and contact links.
import { X } from "lucide-react";
import type { Member } from "@/types/member";
import { theme } from "@/lib/theme";

interface MemberDetailPanelProps {
  member: Member;
  members: Member[];
  onClose: () => void;
}

const STATUS_STYLES: Record<Member["status"], { bg: string; text: string }> = {
  active:   theme.statusActive,
  alumni:   theme.statusAlumni,
  inactive: theme.statusInactive,
};

export function MemberDetailPanel({ member, members, onClose }: MemberDetailPanelProps) {
  const displayName = member.preferredName ?? member.firstName;
  const big = member.bigUid ? members.find((m) => m.uid === member.bigUid) : null;
  const littles = members.filter((m) => m.bigUid === member.uid);
  const statusStyle = STATUS_STYLES[member.status];

  return (
    <div
      className="fixed right-0 top-[63px] h-[calc(100vh-63px)] w-72 z-10 flex flex-col overflow-hidden"
      style={{
        background: theme.bgCard,
        borderLeft: `1px solid ${theme.border}`,
        boxShadow: "-4px 0 24px rgba(75,46,131,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: theme.textPrimary }}
        >
          Member Profile
        </h2>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = theme.border)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
          }
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
              style={{ outline: `3px solid ${theme.primary}20`, outlineOffset: "2px" }}
            />
          ) : (
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: theme.primary, color: "white" }}
            >
              {member.firstName[0] ?? ""}{member.lastName[0] ?? ""}
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
              {displayName} {member.lastName}
            </p>
            {member.role && (
              <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                {member.role}
              </p>
            )}
            <span
              className="inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1.5 font-semibold"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            {member.bio}
          </p>
        )}

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-xs">
          <Row label="Pledge Class" value={`${member.pledgeClassQuarter} '${String(member.pledgeClassYear).slice(-2)}`} />
          <Row label="Major" value={member.major} />
          <Row label="Grad Year" value={String(member.graduationYear)} />
          {member.email && <Row label="Email" value={member.email} />}
          {member.phone && <Row label="Phone" value={member.phone} />}
        </div>

        {/* Big */}
        <div>
          <SectionLabel>Big</SectionLabel>
          {big ? (
            <div className="flex items-center gap-2">
              {big.profilePhotoUrl ? (
                <img src={big.profilePhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div
                  className="h-7 w-7 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: theme.primary, color: "white" }}
                >
                  {big.firstName[0] ?? ""}{big.lastName[0] ?? ""}
                </div>
              )}
              <span className="text-xs" style={{ color: theme.textPrimary }}>
                {big.preferredName ?? big.firstName} {big.lastName}
              </span>
            </div>
          ) : member.bigName ? (
            <p className="text-xs italic" style={{ color: theme.textSecondary }}>
              {member.bigName} (not in directory)
            </p>
          ) : (
            <p className="text-xs" style={{ color: theme.textDim }}>—</p>
          )}
        </div>

        {/* Littles */}
        <div>
          <SectionLabel>
            Littles{littles.length > 0 ? ` (${littles.length})` : ""}
          </SectionLabel>
          {littles.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {littles.map((little) => (
                <div key={little.uid} className="flex items-center gap-2">
                  {little.profilePhotoUrl ? (
                    <img src={little.profilePhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div
                      className="h-7 w-7 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: theme.border, color: theme.textSecondary }}
                    >
                      {little.firstName[0] ?? ""}{little.lastName[0] ?? ""}
                    </div>
                  )}
                  <span className="text-xs" style={{ color: theme.textPrimary }}>
                    {little.preferredName ?? little.firstName} {little.lastName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: theme.textDim }}>No littles yet</p>
          )}
        </div>

        {/* Social links */}
        {member.socialLinks.length > 0 && (
          <div>
            <SectionLabel>Links</SectionLabel>
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
                    className="text-xs hover:underline"
                    style={{ color: theme.primary }}
                  >
                    {link.platform}
                  </a>
                ) : (
                  <span
                    key={link.platform}
                    className="text-xs"
                    style={{ color: theme.textSecondary }}
                  >
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5"
      style={{ color: theme.textDim }}
    >
      {children}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0" style={{ color: theme.textSecondary }}>
        {label}
      </span>
      <span className="font-medium truncate" style={{ color: theme.textPrimary }}>
        {value}
      </span>
    </div>
  );
}
