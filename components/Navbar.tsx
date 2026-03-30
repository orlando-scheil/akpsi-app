// Top navigation bar — shown on all authenticated pages.
// Contains links to main sections and a user avatar dropdown for profile + sign-out.
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Users, GitBranch, Images, LogOut, User, type LucideIcon } from "lucide-react";
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

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Announcements", href: "/announcements", icon: Megaphone },
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
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="relative flex h-14 items-center px-4">
        <Link
          href="/announcements"
          className="text-lg font-bold text-primary-foreground no-underline"
        >
          AKPsi
        </Link>

        {/* Centered nav items */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-none",
                  "border-b-2 transition-opacity text-primary-foreground no-underline",
                  active
                    ? "opacity-100 border-white"
                    : "opacity-70 border-transparent hover:opacity-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: avatar dropdown */}
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-primary/80 transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-white/20 text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {displayName && (
              <span className="text-sm font-medium text-primary-foreground hidden sm:block">
                {displayName}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              variant="destructive"
              className="flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
