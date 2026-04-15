// Top navigation bar — shown on all authenticated pages.
// Deep purple with gold accent stripe; editorial serif logo treatment.
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  Users,
  GitBranch,
  Images,
  CalendarDays,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Directory", href: "/members", icon: Users },
  { label: "Gallery", href: "/gallery", icon: Images },
  { label: "Family Tree", href: "/family-tree", icon: GitBranch },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, member, signOut } = useAuth();

  const displayName = member
    ? (member.preferredName ?? member.firstName)
    : (user?.displayName?.split(" ")[0] ?? "");

  const avatarUrl = member?.profilePhotoUrl ?? user?.photoURL ?? undefined;

  const initials = member
    ? `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`
    : (user?.displayName?.charAt(0) ?? "?");

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: theme.primary, borderBottom: `3px solid ${theme.gold}` }}
    >
      <div className="relative flex h-[60px] items-center px-5">
        {/* Logo */}
        <Link href="/announcements" className="flex items-center gap-2.5 no-underline shrink-0">
          <span
            className="text-[26px] text-white leading-none tracking-tight"
            style={{ fontFamily: "var(--font-display, serif)", fontWeight: 700 }}
          >
            ΑΚΨ
          </span>
          <div className="hidden sm:flex flex-col justify-center gap-[3px]">
            <span className="text-[9px] font-bold tracking-[0.22em] text-white/60 uppercase leading-none">
              Alpha Kappa Psi
            </span>
            <span
              className="text-[9px] tracking-[0.16em] uppercase leading-none"
              style={{ color: theme.gold, opacity: 0.8 }}
            >
              Univ. of Washington
            </span>
          </div>
        </Link>

        {/* Centered nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-stretch h-[60px]">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 text-[13px] font-medium no-underline transition-all duration-150",
                  "border-b-[3px] -mb-[3px]",
                  active
                    ? "border-transparent text-white/65 hover:text-white hover:border-white/30"
                    : "border-transparent text-white/65 hover:text-white hover:border-white/30"
                )}
                style={
                  active
                    ? { color: theme.gold, borderBottomColor: theme.gold }
                    : {}
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: avatar dropdown */}
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors outline-none">
            <Avatar
              className="h-8 w-8"
              style={{ outline: `2px solid ${theme.gold}80`, outlineOffset: "1px" }}
            >
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback
                className="text-xs font-bold"
                style={{ background: theme.gold, color: theme.primary }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {displayName && (
              <span className="text-[13px] font-medium text-white/85 hidden sm:block">
                {displayName}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
