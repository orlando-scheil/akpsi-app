// Top navigation bar — shown on all authenticated pages.
// Contains links to main sections and a sign-out button.
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Megaphone, Users, GitBranch, Images, LogOut, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const { signOut } = useAuth();

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

        {/* Right side spacer + sign out */}
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger
            onClick={signOut}
            aria-label="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </TooltipTrigger>
          <TooltipContent>Sign out</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
