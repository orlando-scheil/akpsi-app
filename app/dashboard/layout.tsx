// Auth-gated layout — wraps all routes under app/dashboard/.
// Redirects unauthenticated users to /login; redirects users without a profile to /dashboard/profile.
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AnnouncementsProvider } from "@/lib/announcements-context";
import { GalleryProvider } from "@/lib/gallery-context";
import { EventsProvider } from "@/lib/events-context";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!member && pathname !== "/dashboard/profile") {
      router.replace("/dashboard/profile");
    }
  }, [user, member, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AnnouncementsProvider>
      <GalleryProvider>
        <EventsProvider>
          <Navbar />
          {children}
        </EventsProvider>
      </GalleryProvider>
    </AnnouncementsProvider>
  );
}
